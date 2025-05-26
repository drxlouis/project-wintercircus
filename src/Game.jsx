/* eslint-disable no-unused-vars */
import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import Confetti from "react-confetti";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Sparkles, Html } from "@react-three/drei";
import { useWindowSize } from "@react-hook/window-size";

function TemboModel({ screenWidth }) {
  const { scene } = useGLTF('./tembo.glb');
  // Schaal tussen 0.0015 (mobiel) en 0.003 (desktop)
  const scale = screenWidth < 600 ? 0.15 : screenWidth < 900 ? 0.15 : screenWidth < 1200 ? 0.2 : 0.25;
  return (
    <primitive
      object={scene}
      scale={scale}
      // gebruik decimalen voor positie en rotatie!! 
      position={[0, -0.5, 0]}
      rotation={[0, 2.7, 0]}
    />
  );
}

function GameScreen() {
  const [tasks, setTasks] = useState([
    { id: 1, name: "Was Tembo", done: false, image: "./sponge.png" },
    { id: 2, name: "Voeder Tembo", done: false, image: "./food.png" },
    {
      id: 3,
      name: "Verzamel voedsel",
      done: false,
      image: "./basket.png",
    },
  ]);
  const [playerName, setPlayerName] = useState("");
  const [showCertificate, setShowCertificate] = useState(false);
  const certificateRef = useRef(null);
  const [width, height] = useWindowSize();
  const [activeMode, setActiveMode] = useState(null);
  const [cleaningProgress, setCleaningProgress] = useState(0);
  const [feedingGameProgress, setFeedingGameProgress] = useState(0);
  const [bringingGameProgress, setBringingGameProgress] = useState(0);
  const [availableFood, setAvailableFood] = useState([]);
  const [fallingItems, setFallingItems] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const canvasRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const weetjes = [
    "het wintercircus vroeger een grote garage was? Hier stonden toen heel veel auto’s net een museum",
    "Lang geleden, in 1894, werd er in Gent een speciaal gebouw gemaakt waar het altijd circus kon zijn, zelfs in de winter. ",
    "Tembo vroeger in de dierentuin van Gent woonde? Veel kinderen gingen naar hem kijken. Hij was heel bekend en iedereen vond hem leuk.",
    "Toen de dierentuin dichtging, moest Tembo verhuizen naar een andere dierentuin. Veel mensen vonden dat jammer, want ze waren dol op hem.",
  ];
  const [activeWeetje, setActiveWeetje] = useState(null);

  const allDone = tasks.every((task) => task.done);

  function handleTaskClick(task) {
    if (task.name === "Was Tembo") {
      setActiveMode("cleaning");
    } else if (task.name === "Voeder Tembo") {
      setActiveMode("feeding");
    } else if (task.name === "Verzamel voedsel") {
      setActiveMode("bringing");
    }
  }

  function completeTask(taskName) {
    setTasks((prev) =>
      prev.map((task) =>
        task.name === taskName ? { ...task, done: true } : task
      )
    );
    setActiveMode(null);
    setShowSparkles(true);
    setTimeout(() => setShowSparkles(false), 2000);
  }

  async function downloadCertificate() {
    if (certificateRef.current) {
      const canvas = await html2canvas(certificateRef.current);
      const link = document.createElement("a");
      link.download = "Tembo_Certificaat.png";
      link.href = canvas.toDataURL();
      link.click();
    }
  }

  function handleDraw(e) {
    if (!isDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.clearRect(x - 15, y - 15, 30, 30);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const totalPixels = imageData.data.length / 4;
    let transparentPixels = 0;

    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) transparentPixels++;
    }

    let progress = Math.floor((transparentPixels / totalPixels) * 100);
    if (progress >= 98) progress = 100;
    setCleaningProgress(progress);
  }

  function handleTouchDraw(e) {
    e.preventDefault();

    if (!isDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();

    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.clearRect(x - 15, y - 15, 30, 30);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const totalPixels = imageData.data.length / 4;
    let transparentPixels = 0;

    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) transparentPixels++;
    }

    let progress = Math.floor((transparentPixels / totalPixels) * 100);
    if (progress >= 98) progress = 100;

    setCleaningProgress(progress);
  }

  function resetCleaning() {
    setCleaningProgress(0);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.fillStyle = "rgba(139,69,19,0.8)";
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }

  function handleFoodDrop(foodId) {
    setAvailableFood((prev) => prev.filter((f) => f.id !== foodId));
    setFeedingGameProgress((prev) => Math.min(100, prev + 20));
  }

  function collectItem(itemId) {
    setFallingItems((prev) => prev.filter((item) => item.id !== itemId));
    setBringingGameProgress((prev) => Math.min(100, prev + 10));
  }

  useEffect(() => {
    const video = document.getElementById("camera");
    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode: { exact: "environment" }
          }
        })
        .then((stream) => {
          video.srcObject = stream;
          video.play();
        })
        .catch((err) => {
          // Fallback to any available camera if back camera fails
          console.error("Back camera not available, trying fallback:", err);
          navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
              video.srcObject = stream;
              video.play();
            })
            .catch((err) => {
              console.error("Error accessing any camera:", err);
            });
        });
    }
  }, []);

  useEffect(() => {
    if (activeMode === "cleaning" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      ctx.fillStyle = "rgba(139,69,19,0.8)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [activeMode]);

  useEffect(() => {
    if (cleaningProgress >= 100) {
      completeTask("Was Tembo");
    }
  }, [cleaningProgress]);

  useEffect(() => {
    if (activeMode !== "feeding") return;

    const interval = setInterval(() => {
      const foodTypes = ["🍌", "🍎", "🥥", "🥕", "💧"];
      const randomFood =
        foodTypes[Math.floor(Math.random() * foodTypes.length)];

      setAvailableFood((prev) => [
        ...prev,
        {
          id: Math.random(),
          emoji: randomFood,
          x: Math.random() * (window.innerWidth - 50),
          y: 0,
        },
      ]);
    }, 1500);

    return () => clearInterval(interval);
  }, [activeMode]);

  useEffect(() => {
    if (feedingGameProgress >= 100) {
      completeTask("Voeder Tembo");
    }
  }, [feedingGameProgress]);

  useEffect(() => {
    if (activeMode !== "bringing") return;

    const interval = setInterval(() => {
      const items = ["🌾", "💧"];
      const randomItem = items[Math.floor(Math.random() * items.length)];

      setFallingItems((prev) => [
        ...prev,
        {
          id: Math.random(),
          emoji: randomItem,
          x: Math.random() * (window.innerWidth - 50),
          y: 0,
        },
      ]);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeMode]);

  useEffect(() => {
    if (activeMode !== "bringing") return;

    const moveInterval = setInterval(() => {
      setFallingItems((prev) =>
        prev.map((item) => ({ ...item, y: item.y + 5 }))
      );
    }, 50);

    return () => clearInterval(moveInterval);
  }, [activeMode]);

  useEffect(() => {
    if (bringingGameProgress >= 100) {
      completeTask("Verzamel voedsel");
    }
  }, [bringingGameProgress]);

  useEffect(() => {
    if (allDone) {
      setShowCertificate(true);
    }
  }, [allDone]);

  function resetGame() {
    setTasks([
      { id: 1, name: "Was Tembo", done: false, image: "./sponge.png" },
      { id: 2, name: "Voeder Tembo", done: false, image: "./food.png" },
      { id: 3, name: "Verzamel voedsel", done: false, image: "./basket.png" },
    ]);
    setPlayerName("");
    setShowCertificate(false);
    setCleaningProgress(0);
    setFeedingGameProgress(0);
    setBringingGameProgress(0);

    // Camera opnieuw starten
    setTimeout(() => {
      const video = document.getElementById("camera");
      if (video && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then((stream) => {
            video.srcObject = stream;
          })
          .catch((err) => {
            console.error("Error accessing camera: ", err);
          });
      }
    }, 100);
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black touch-none">
      {showCertificate && <Confetti width={width} height={height} />}

      {/* Zet de camera-video HIER, zodat hij altijd zichtbaar is behalve bij certificaat */}
      {!showCertificate && (
        <video
          id="camera"
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {!showCertificate && !activeMode ? (
        <>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <Canvas camera={{ position: [0, 1.5, 5], fov: 50 }}>
              <ambientLight />
              <directionalLight position={[2, 2, 5]} />
              <motion.group
                initial={{ y: 0 }}
                animate={{ y: allDone ? [0, 0.2, -0.2, 0.2, 0] : 0 }}
                transition={{ duration: 1 }}
              >
                <TemboModel screenWidth={width} />
                {/* Interactieve cirkels */}
                {weetjes.map((_, i, arr) => (
                  <mesh
                    key={i}
                    position={[
                      Math.cos((i / arr.length) * 2 * Math.PI) * 2, // verdeel over de cirkel
                      0.3 + (i === 1 ? 1 : 0), // optioneel: Y-positie aanpassen voor variatie
                      Math.sin((i / arr.length) * 2 * Math.PI) * 2,
                    ]}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveWeetje(i);
                    }}
                  >
                    <sphereGeometry args={[0.15, 32, 32]} />
                    <meshStandardMaterial
                      color="orange"
                      transparent
                      opacity={0.5}
                    />
                    <Html center zIndexRange={[-1, 0]} portal={null}>
                      <span
                        style={{
                          color: "white",
                          fontWeight: "bold",
                          pointerEvents: "none",
                          textShadow: "0 0 5px #000",
                          userSelect: "none",
                          opacity: 1,
                        }}
                      >
                      </span>
                    </Html>
                  </mesh>
                ))}
                {showSparkles && (
                  <Sparkles count={30} scale={2} size={3} color="white" />
                )}
              </motion.group>
              <OrbitControls
                  enableZoom={false}  // Keep zoom disabled (or set to true if needed)
                  enablePan={false}   // Allow panning (but we'll restrict it)
                  autoRotate={true}
                  autoRotateSpeed={1.5}
                  onChange={(e) => {
                      // Zet de camera vast als je van as beweegt
                      e.target.object.position.y = 0; // As aanpassen
                      
                      e.target.object.updateProjectionMatrix();
                  }}
                  />
            </Canvas>
          </div>
          {/* voor mobile safari safe area */}
          <div id="task-buttons" className="absolute bottom-20 w-full flex flex-wrap items-center justify-center z-10 pointer-events-auto" style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>
            {tasks.map((task, idx) => (
              <motion.button
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className={`w-20 h-20 m-3 flex items-center justify-center rounded-full shadow-md
      ${task.done ? "bg-green-400" : "bg-orange-400"}
    `}
                initial={{ opacity: 0, y: 30, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: idx * 0.1,
                  type: "spring",
                  stiffness: 200,
                }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                style={{ aspectRatio: "1/1", border: "none" }}
              >
                <img
                  src={task.image}
                  alt={task.name}
                  className="w-10 h-10 object-contain"
                  style={{ filter: task.done ? "grayscale(1)" : "none" }}
                />
              </motion.button>
            ))}
          </div>
          {allDone && (
            <div className="absolute bottom-24 w-full flex flex-col items-center space-y-4">
              <p className="text-lg text-white">
                Vul je naam in voor je certificaat:
              </p>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="border-2 border-white p-2 rounded-lg text-lg bg-black text-white placeholder-white"
                placeholder="Jouw naam"
              />
              <button
                onClick={() => setShowCertificate(true)}
                disabled={!playerName}
                className="bg-green-500 text-white px-6 py-3 rounded-2xl text-xl hover:bg-green-600"
              >
                Toon certificaat
              </button>
            </div>
          )}
        </>
      ) : activeMode === "cleaning" ? (

        <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50">
          <button
            onClick={() => setActiveMode(null)}
            className="absolute top-4 left-4 z-50 bg-gray-700 bg-opacity-70 hover:bg-gray-900 text-white rounded-full p-3 shadow-lg"
            aria-label="Terug"
          >
            {/* Unicode pijl of SVG */}
            <span style={{ fontSize: 24 }}>←</span>
          </button>
          <p className="text-white text-2xl mb-4">Maak Tembo schoon!</p>
          <div className="relative w-64 h-64">
            <Canvas camera={{ position: [0, 1.5, 5], fov: 50 }}>
              <ambientLight />
              <directionalLight position={[2, 2, 5]} />
              <TemboModel 
                  position={[0, -0.2, 0]}
                  rotation={[-0.2, 2.7, 0]}
                  scale={10}
                  zIndexRange={[1000, 1000]}

              />
            </Canvas>
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full touch-none"
              onMouseDown={() => setIsDrawing(true)}
              onMouseUp={() => setIsDrawing(false)}
              onMouseMove={handleDraw}
              onTouchStart={() => setIsDrawing(true)}
              onTouchEnd={() => setIsDrawing(false)}
              onTouchMove={handleTouchDraw}
              style={
                {
                  cursor: isDrawing
                    ? `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='48' viewport='0 0 100 100' style='fill:black;font-size:24px;'><text y='50%'>🧽</text></svg>") 16 0, auto`
                    : "auto",
                }
              }
            />
          </div>
          <p className="text-white mt-4">{cleaningProgress}% schoon</p>
          <button
            onClick={resetCleaning}
            className="mt-4 bg-red-500 text-white px-6 py-2 rounded-xl text-lg hover:bg-red-600"
          >
            Reset
          </button>
        </div>
      ) : activeMode === "feeding" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-800 bg-opacity-90 z-50">
          <button
            onClick={() => setActiveMode(null)}
            className="absolute top-4 left-4 z-50 bg-gray-700 bg-opacity-70 hover:bg-gray-900 text-white rounded-full p-3 shadow-lg"
            aria-label="Terug"
          >
            {/* Unicode pijl of SVG */}
            <span style={{ fontSize: 24 }}>←</span>
          </button>
          <p className="text-3xl text-white mb-4">Voeder Tembo!</p>

          <div className="relative w-full h-1/2">
            {/* 3D Tembo model */}
            <div className="relative w-64 h-64 mx-auto">
              <Canvas camera={{ 
                  position: [0, 1.5, 5], 
                fov: 50,
                }}>
                <ambientLight />
                <directionalLight position={[2, 2, 5]} />
                <TemboModel />
              </Canvas>
              {/* Onzichtbare "mond"-hitbox */}
              <div
                id="tembo-mouth"
                className="absolute top-[10px] left-[130px] transform -translate-x-1/2 w-36 h-36"
                style={{
                  borderRadius: "50%",
                  pointerEvents: "none",
                  opacity: 0.5,
                }}
              />
            </div>

            {/* Voedselitems */}
            {availableFood.map((food) => (
              <motion.div
                key={food.id}
                drag
                dragElastic={0.5}
                onDragEnd={(e, info) => {
                  const mouth = document
                    .getElementById("tembo-mouth")
                    .getBoundingClientRect();
                  if (
                    info.point.x > mouth.left &&
                    info.point.x < mouth.right &&
                    info.point.y > mouth.top &&
                    info.point.y < mouth.bottom
                  ) {
                    handleFoodDrop(food.id);
                  }
                }}
                className="absolute text-4xl cursor-pointer z-20"
                style={{ top: food.y, left: food.x }}
              >
                {food.emoji}
              </motion.div>
            ))}
          </div>

          {/* Voortgangsbalk */}
          <div className="mt-6 w-1/2 bg-white rounded-full overflow-hidden">
            <div
              className="bg-green-400 h-6"
              style={{ width: `${feedingGameProgress}%` }}
            ></div>
          </div>
          <p className="text-white mt-2">{feedingGameProgress}% gevoerd</p>
        </div>
      ) : activeMode === "bringing" ? (
        <div className="absolute inset-0 bg-blue-800 bg-opacity-90 flex flex-col items-center justify-center z-50">
          <button
            onClick={() => setActiveMode(null)}
            className="absolute top-4 left-4 z-50 bg-gray-700 bg-opacity-70 hover:bg-gray-900 text-white rounded-full p-3 shadow-lg"
            aria-label="Terug"
          >
            {/* Unicode pijl of SVG */}
            <span style={{ fontSize: 24 }}>←</span>
          </button>
          <p className="text-3xl text-white mb-4">Vang hooi en water!</p>
          <div className="relative w-full h-1/2">
            {fallingItems.map((item) => (
              <motion.div
                key={item.id}
                className="absolute text-4xl"
                style={{ 
                  top: item.y, 
                  left: item.x,
                  cursor: fallingItems
                    ? `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='48' viewport='0 0 100 100' style='fill:black;font-size:24px;'><text y='50%'>🧺</text></svg>") 16 0, auto`
                    : "auto",
                }}
                onClick={() => collectItem(item.id)}
              >
                {item.emoji}
              </motion.div>
            ))}
          </div>
          <div className="mt-6 w-1/2 bg-white rounded-full overflow-hidden">
            <div
              className="bg-blue-400 h-6"
              style={{ width: `${bringingGameProgress}%` }}
            ></div>
          </div>
          <p className="text-white mt-2">{bringingGameProgress}% verzameld</p>
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center min-h-screen bg-black bg-opacity-80 fixed inset-0 z-50">
          <div
            ref={certificateRef}
            className="w-full max-w-md mx-auto bg-yellow-100 p-8 rounded-2xl shadow-2xl text-center space-y-4"
          >
            <h2 className="text-3xl font-extrabold text-orange-700">
              🎖️ Officieel Certificaat 🎖️
            </h2>
            <p className="text-lg text-orange-600">Dit certificeert dat</p>
            {/* Inputveld mag altijd zichtbaar behalve tijdens downloaden */}
            {!isDownloading && (
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="border-2 border-white p-2 rounded-lg text-lg bg-black text-white placeholder-white mb-2"
                placeholder="Jouw naam"
              />
            )}
            <h3 className="text-4xl font-bold text-green-700">{playerName}</h3>
            <p className="text-lg text-orange-600">
              met succes Tembo heeft verzorgd!
            </p>
            <p className="text-sm text-gray-500">
              Tembo's Grote Circusavontuur - {new Date().toLocaleDateString()}
            </p>
            {/* Knoppen alleen tonen als NIET aan het downloaden */}
            {!isDownloading && (
              <>
                <button
                  onClick={async () => {
                    setIsDownloading(true);
                    await new Promise((r) => setTimeout(r, 100));
                    await downloadCertificate();
                    setIsDownloading(false);
                  }}
                  className="mt-4 bg-orange-500 text-white px-8 py-4 rounded-2xl text-xl hover:bg-orange-600"
                >
                  Download Certificaat
                </button>
                <button
                  onClick={resetGame}
                  className="mt-4 bg-green-500 text-white px-8 py-4 rounded-2xl text-xl hover:bg-green-600"
                >
                  Speel opnieuw
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {showCertificate && (
        <div className="flex justify-center items-center">
          <button
            onClick={downloadCertificate}
            className="mt-6 bg-orange-500 text-white px-8 py-4 rounded-2xl text-xl hover:bg-orange-600"
          >
            Download Certificaat
          </button>
        </div>
      )}
      {activeWeetje !== null && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-60">
          <div className="bg-white rounded-2xl p-8 max-w-xs text-center shadow-xl">
            <p className="text-xl font-bold text-orange-600 mb-4">
              Wist je dat?
            </p>
            <p className="text-gray-800">{weetjes[activeWeetje]}</p>
            <button
              className="mt-6 bg-orange-500 text-white px-4 py-1 rounded-xl text-sm hover:bg-orange-600"
              onClick={() => setActiveWeetje(null)}
            >
              Sluiten
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GameScreen;
