import { createEffect, createSignal } from "solid-js";
import "./App.css";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

function App() {
  return (
    <div>
      <FFM />
    </div>
  );
}

function FFM() {
  const [loaded, setLoaded] = createSignal(false);

  let ffmpegRef = new FFmpeg();
  let videoRef: HTMLVideoElement | null = null;
  let messageRef: HTMLParagraphElement | null = null;

  const title = "Karlsson MP3 to MP4 Converter 9000 Supreme";

  createEffect(() => {
    document.title = title;
  });

  const load = async () => {
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
    const ffmpeg = ffmpegRef;
    ffmpeg.on("log", ({ message }) => {
      if (!messageRef) throw new Error("Expected message div");
      messageRef.innerHTML = message;
      console.log(message);
    });
    console.log("loading FFMPEG");
    await ffmpeg
      .load({
        coreURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.js`,
          "text/javascript",
        ),
        wasmURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.wasm`,
          "application/wasm",
        ),
      })
      .catch((e) => console.error(e));
    console.log("loaded FFMPEG");
    setLoaded(true);
  };

  const transcode = async (list: FileList) => {
    const ffmpeg = ffmpegRef;
    const file = list[0];
    const inputName = "input.mp3";
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    await ffmpeg.exec([
      "-f",
      "lavfi",
      "-i",
      "color=c=black:s=128x72",
      "-i",
      inputName,
      "-shortest",
      "-fflags",
      "+shortest",
      "output.mp4",
    ]);
    const data = await ffmpeg.readFile("output.mp4");
    if (!videoRef) return;

    const url = URL.createObjectURL(new Blob([data], { type: "video/mp4" }));
    downloadURI(url, "test.mp4");
  };

  return (
    <>
      <h2>{title}</h2>
      {loaded() ? (
        <>
          <video ref={(el) => (videoRef = el)} controls></video>
          <br />
          <input
            type="file"
            accept="audio/mpeg"
            onChange={(e) =>
              e.target.files?.length && transcode(e.target.files)
            }
            multiple
          />
          <p ref={(el) => (messageRef = el)}></p>
        </>
      ) : (
        <button onClick={load}>
          Click here to load the converter (may take a while)
        </button>
      )}
    </>
  );
}

function downloadURI(uri: string, name: string) {
  const link = document.createElement("a");
  link.download = name;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default App;
