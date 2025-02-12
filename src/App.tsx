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
      messageRef.innerHTML = message.startsWith("Aborted()")
        ? "Done (hopefully?)"
        : message;
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
      .catch((e) => {
        console.error(e);
        messageRef!.innerHTML = e;
      });
    console.log("loaded FFMPEG");
    setLoaded(true);
  };
  load();

  const transcode = async (list: FileList) => {
    const ffmpeg = ffmpegRef;
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      const inputName = `input.mp3`;
      console.log("Converting", file.name, inputName);
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
      const data = await ffmpeg.readFile(`output.mp4`);
      const url = URL.createObjectURL(new Blob([data], { type: "video/mp4" }));
      const outputName = file.name.split(".")[0] + ".mp4";
      downloadURI(url, outputName);
    }
  };

  return (
    <>
      <h2>{title}</h2>
      <p>
        This tool takes in a bunch of MP3 files and turns them into proper MP4
        files that services like Vimeo should accept. Processing is all done
        offline (no internet required after the converter loads up) with the MP4
        files just put into your Downloads folder.
      </p>
      {loaded() ? (
        <>
          <strong>
            Select all the files you want to convert (hold Ctrl or CMD to select
            multiple):
          </strong>
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
          <p>
            Your browser might ask for permission to download multiple files -
            just click "Allow" if that happens.
          </p>
        </>
      ) : (
        <strong>Loading, please wait...</strong>
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
