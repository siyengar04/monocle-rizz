import Head from "next/head";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { useState, useEffect } from "react";
import { ensureConnected } from "@/utils/bluetooth/js/main";
import { replRawMode, replSend } from "@/utils/bluetooth/js/repl";
import { Button } from "antd";
import { useWhisper } from "@chengsokdara/use-whisper";
import { app } from "@/utils/app";
import { execMonocle } from "@/utils/comms";


const inter = Inter({ subsets: ["latin"] });

const Home = () => {
  const [connected, setConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const { startRecording, stopRecording, transcript } = useWhisper({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_TOKEN,
    streaming: true,
    timeSlice: 500,
    whisperConfig: {
      language: "en",
    },
  });

  const fetchGpt = async () => {
    console.log("Starting fetchGpt...");
    try {
      const response = await fetch(`https://api.openai.com/v1/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-davinci-003",
          prompt:
            systemPrompt +
            "\ntranscript: " +
            userPrompt +
            "\noptimal interviewee's response: ",
          temperature: 0.7,
          max_tokens: 512,
          frequency_penalty: 0,
          presence_penalty: 0,
        }),
      });
  
      console.log("Response received", response);
  
      if (!response.ok) {
        console.error("Error fetching GPT response", response.statusText);
        return;
      }
  
      const resJson = await response.json();
      console.log("Response JSON", resJson);
      const res = resJson?.choices?.[0]?.text;
      if (!res) return;
  
      await displayRawRizz(res.trim());
    } catch (error) {
      console.error("Error fetching GPT response", error);
    }
  };
  
  
  

  useEffect(() => {
    // Sync the window variable and the transcript
    window.transcript = transcript.text;
  }, [transcript.text]);

  return (
    <>
      <Head>
        <title>rizzGPT</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${inter.className} ${styles.main}`}>
        <div className="flex w-screen h-screen flex-col items-center justify-center">
          <p className="text-3xl">{connected ? "Connected" : "Disconnected"}</p>
          {transcript.text}
          <Button
            type="primary"
            onClick={async () => {
              await ensureConnected(logger, relayCallback);
              app.run(execMonocle);
              await displayRawRizz();
            }}
          >
            Connect
          </Button>
          <div className="flex items-center mt-5 gap-2">
            <Button onClick={onRecord}>
              {isRecording ? "Stop recording" : "Start recording"}
            </Button>
            <Button onClick={fetchGpt}>Get response</Button>
          </div>
        </div>
      </main>
    </>
  );

  function relayCallback(msg) {
    if (!msg) {
      return;
    }
    if (msg.trim() === "trigger b") {
      // Left btn
      // fetchGpt();
    }

    if (msg.trim() === "trigger a") {
      // Right btn
      // onRecord();
    }
  }

  function onRecord() {
    isRecording ? stopRecording() : startRecording();
    setIsRecording(!isRecording);
  }

  function wrapText(inputText) {
    const block = 30;
    let text = [];
    for (let i = 0; i < 6; i++) {
      text.push(
        inputText.substring(block * i, block * (i + 1)).replace("\n", "")
      );
    }

    return text;
  }

  async function displayRizz(rizz) {
    if (!rizz) return;
    const splitText = wrapText(rizz);
    let replCmd = "import display;";

    for (let i = 0; i < splitText.length; i++) {
      replCmd += `display.text("${splitText[i]}", 0, ${i * 50}, 0xffffff);`;
    }

    replCmd += "display.show();";

    console.log("**** replCmd ****", replCmd);

    await replSend(replCmd);
  }

  async function displayRawRizz(rizz) {
    await replRawMode(true);
    await displayRizz(rizz);
  }

  async function logger(msg) {
    if (msg === "Connected") {
      setConnected(true);
    }
  }
};

export default Home;
