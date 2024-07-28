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

  createEffect(() => {
    document.title = "Karlsson MP3 to MP4 Converter 9000";
  });

  const load = async () => {
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
    const ffmpeg = ffmpegRef;
    ffmpeg.on("log", ({ message }) => {
      if (!messageRef) throw new Error("Expected message div");
      messageRef.innerHTML = message;
      console.log(message);
    });
    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
    console.log("loading");
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
    console.log("loaded");
    setLoaded(true);
  };

  const transcode = async (list: FileList) => {
    const ffmpeg = ffmpegRef;
    const file = list[0];
    await ffmpeg.writeFile(file.name, await fetchFile(file));
    await ffmpeg.exec([
      "-f",
      "lavfi",
      "-i",
      "color=c=black:s=128x72",
      "-i",
      file.name,
      "-shortest",
      "-fflags",
      "+shortest",
      "output.mp4",
    ]);
    const data = await ffmpeg.readFile(file.name + ".mp4");
    if (!videoRef) return;
    videoRef.src = URL.createObjectURL(new Blob([data], { type: "video/mp4" }));
  };

  return (
    <>
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

export default App;
