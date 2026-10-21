const { CdpSession } = require("./cdp");
const fs = require("fs");
const path = require("path");

async function capture() {
  const cdp = new CdpSession({ port: 9595, url: "http://localhost:8085" });
  await cdp.launch();
  await cdp.navigate("http://localhost:8085");
  await new Promise(r => setTimeout(r, 2000)); // wait for scenery to preload

  const stages = [
    { world: 7, sub: 0, name: "comala_pueblo_blanco_hd" },
    { world: 0, sub: 0, name: "cuauhtemoc_volcano_cane_hd" },
    { world: 4, sub: 0, name: "tecoman_limon_hd" },
    { world: 2, sub: 2, name: "manzanillo_pezvela_hd" },
    { world: 9, sub: 0, name: "colima_catedral_hd" },
    { world: 1, sub: 1, name: "minatitlan_cascada_hd" },
    { world: 3, sub: 2, name: "armeria_olaverde_hd" },
    { world: 5, sub: 2, name: "ixtlahuacan_grutas_hd" },
    { world: 6, sub: 1, name: "coquimatlan_amiales_hd" },
    { world: 8, sub: 0, name: "villa_perritos_hd" }
  ];

  const brainDir = "/Users/victormanuel/.gemini/antigravity/brain/a797a4ef-e34f-4474-9f43-6dca810b6c75";

  for (const s of stages) {
    await cdp.evaluate(`
      loadStage(${s.world}, ${s.sub}, false);
      cameraX = 0;
      render();
    `);
    await new Promise(r => setTimeout(r, 400));
    
    const dataUrl = await cdp.evaluate(`document.getElementById("gameCanvas").toDataURL("image/png")`);
    const commaIdx = dataUrl.indexOf(",");
    const base64Data = dataUrl.slice(commaIdx + 1);
    const outPath = path.join(brainDir, "verificacion_" + s.name + ".png");
    fs.writeFileSync(outPath, base64Data, "base64");
    console.log("Saved:", outPath);
  }

  await cdp.kill();
  console.log("All screenshots captured successfully!");
}

capture().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
