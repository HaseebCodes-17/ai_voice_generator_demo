"use client";

import { useState, useRef, useEffect } from "react";
import { FiUpload, FiPlay, FiPause, FiDownload } from "react-icons/fi";
import { RiVoiceprintLine } from "react-icons/ri";
import { BsMagic, BsCheckCircle } from "react-icons/bs";``

export default function VoiceGenerator() {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("21m00Tcm4TlvDq8ikWAM");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // Voice options with sample preview text
  const voiceOptions = [
    {
      id: "21m00Tcm4TlvDq8ikWAM",
      name: "Rachel",
      previewText: "Hello, I'm Rachel. How can I help you today?",
      accent: "American",
      gender: "Female",
      style: "Professional",
    },
    {
      id: "AZnzlk1XvdvUeBnXmlld",
      name: "Domi",
      previewText: "Hey there, I'm Domi with my deep voice.",
      accent: "American",
      gender: "Female",
      style: "Casual",
    },
    {
      id: "EXAVITQu4vr4xnSDxMaL",
      name: "Bella",
      previewText: "Hi, I'm Bella. Nice to meet you!",
      accent: "British",
      gender: "Female",
      style: "Friendly",
    },
  ];

  // Simulate loading progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return 95;
          return prev + 5;
        });
      }, 300);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const playVoicePreview = async (voiceId: string) => {
    const voice = voiceOptions.find((v) => v.id === voiceId);
    if (!voice) return;

    setIsPlayingPreview(true);
    try {
      const response = await fetch("/api/generate-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: voice.previewText,
          voice: voiceId,
        }),
      });

      if (!response.ok) throw new Error("Preview failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Create new audio element and play
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play();
      setIsPlaying(true);
      audio.onended = () => {
        setIsPlayingPreview(false);
        setIsPlaying(false);
      };
    } catch (error) {
      console.error("Preview error:", error);
      setIsPlayingPreview(false);
      setIsPlaying(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  const generateVoice = async () => {
    if (!text) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("text", text);

      if (isCloning) {
        if (!audioFile) {
          throw new Error("Please upload an audio file for voice cloning");
        }
        formData.append("audioFile", audioFile);
      } else {
        formData.append("voice", voice);
      }

      const response = await fetch("/api/generate-voice", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate voice");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "An error occurred during voice generation");
    } finally {
      setIsLoading(false);
      setProgress(100);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const toggleAudioPlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <RiVoiceprintLine className="text-indigo-600 text-4xl mr-3" />
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              VoiceForge AI
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Transform text into natural sounding speech with cutting-edge AI
            technology
          </p>
        </header>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden mb-8">
          {/* Toggle Section */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Voice Generation Mode
                </h2>
                <p className="text-gray-500 text-sm">
                  {isCloning
                    ? "Create a custom voice from your audio sample"
                    : "Select from premium pre-built voices"}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCloning}
                  onChange={() => setIsCloning(!isCloning)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {isCloning ? "Voice Cloning" : "Standard Voices"}
                </span>
              </label>
            </div>
          </div>

          {/* Voice Cloning Section */}
          {isCloning && (
            <div className="p-6 border-b border-gray-100">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-800 mb-3">
                  Upload Your Voice Sample
                </h3>
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                    <FiUpload className="w-10 h-10 mb-3 text-gray-400" />
                    {audioFile ? (
                      <>
                        <p className="mb-2 text-sm font-medium text-gray-700">
                          {audioFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Click to change file
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          WAV or MP3 (30+ seconds recommended)
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <div className="mt-3 text-sm text-gray-500">
                  <p className="font-medium">Tips for best results:</p>
                  <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li>Record in a quiet environment</li>
                    <li>Use clear, natural speech</li>
                    <li>Avoid background noise</li>
                    <li>30-60 seconds of audio works best</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Standard Voices Section */}
          {!isCloning && (
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Select Voice Profile
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {voiceOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`p-4 rounded-lg border transition-all ${
                      voice === option.id
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-gray-200 hover:border-indigo-200 cursor-pointer"
                    }`}
                    onClick={() => setVoice(option.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {option.name}
                        </h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                            {option.accent}
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                            {option.gender}
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                            {option.style}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playVoicePreview(option.id);
                        }}
                        className={`p-2 rounded-full ${
                          isPlayingPreview && voice === option.id
                            ? "bg-indigo-100 text-indigo-600"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                        disabled={isPlayingPreview}
                      >
                        {isPlayingPreview && voice === option.id ? (
                          <FiPause className="w-4 h-4" />
                        ) : (
                          <FiPlay className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id={`voice-${option.id}`}
                          name="voice"
                          value={option.id}
                          checked={voice === option.id}
                          onChange={() => setVoice(option.id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label
                          htmlFor={`voice-${option.id}`}
                          className="ml-2 block text-sm text-gray-700"
                        >
                          Select this voice
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Text Input Section */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              Enter Your Text
            </h3>
            <textarea
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              rows={5}
              placeholder="Type or paste the text you want to convert to speech..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">
                {text.length} characters
              </span>
              <button
                className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                onClick={() => {
                  setText(
                    "The quick brown fox jumps over the lazy dog. This sentence contains all the letters in the English alphabet."
                  );
                }}
              >
                <BsMagic className="mr-1" /> Try sample text
              </button>
            </div>
          </div>

          {/* Generate Button Section */}
          <div className="p-6">
            <button
              className={`w-full py-4 px-6 rounded-lg font-medium text-white transition-all flex items-center justify-center ${
                isLoading || !text || (isCloning && !audioFile)
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-indigo-200"
              }`}
              onClick={generateVoice}
              disabled={isLoading || !text || (isCloning && !audioFile)}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {isCloning ? "Cloning Voice..." : "Generating Voice..."}
                </>
              ) : (
                <>
                  <RiVoiceprintLine className="mr-2 text-lg" />
                  {isCloning ? "Clone & Generate Voice" : "Generate Voice"}
                </>
              )}
            </button>

            {/* Progress Bar */}
            {isLoading && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1 text-center">
                  {isCloning
                    ? "Creating your custom voice model..."
                    : "Generating your audio..."}
                </p>
              </div>
            )}

            {/* Success Message */}
            {showSuccess && (
              <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center">
                <BsCheckCircle className="mr-2 text-green-600" />
                <span>
                  Voice {isCloning ? "cloned and" : ""} generated successfully!
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {audioUrl && (
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Your Generated Audio
              </h2>
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <button
                    onClick={toggleAudioPlayback}
                    className="p-3 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200 transition-colors"
                  >
                    {isPlaying ? (
                      <FiPause className="w-5 h-5" />
                    ) : (
                      <FiPlay className="w-5 h-5" />
                    )}
                  </button>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-800">
                      {isCloning ? "Cloned Voice" : "Generated Voice"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <a
                  href={audioUrl}
                  download={
                    isCloning ? "cloned-voice.mp3" : "generated-voice.mp3"
                  }
                  className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FiDownload className="mr-2" />
                  Download
                </a>
              </div>
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
