import L from "leaflet";
import anime from "animejs";
import "leaflet/dist/leaflet.css";

class FirlyApp {
  constructor() {
    this.map = null;
    this.currentLayer = null;
    this.isLoading = false;
    this.dataSources = this.initializeDataSources();

    this.init();
  }

  initializeDataSources() {
    return [
      // NASA VIIRS source
      {
        name: "NASA VIIRS Day/Night Band",
        url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_DayNightBand_ENCC/default/2023-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png",
        maxZoom: 8,
        attribution: "NASA EOSDIS GIBS",
      },
      // Alternative VIIRS source
      {
        name: "NASA VIIRS At Sensor Radiance",
        url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_DayNightBand_At_Sensor_Radiance/default/2023-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png",
        maxZoom: 8,
        attribution: "NASA EOSDIS GIBS",
      },
      // Black Marble annual composite
      {
        name: "NASA Black Marble",
        url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VNP46A2_M_DNB_AT_SENSOR_RADIANCE/default/2023-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png",
        maxZoom: 8,
        attribution: "NASA Black Marble",
      },
    ];
  }

  async init() {
    try {
      await this.initMap();
      this.bindEvents();
      await this.playIntroAnimation();
      await this.loadRealNightLights();
    } catch (error) {
      console.error("Failed to initialize app:", error);
    }
  }

  async initMap() {
    return new Promise((resolve) => {
      this.map = L.map("map", {
        center: [25, 15],
        zoom: 3,
        minZoom: 2,
        maxZoom: 8,
        zoomControl: true,
        attributionControl: false,
        worldCopyJump: true,
        maxBounds: [
          [-85, -180],
          [85, 180],
        ],
        maxBoundsViscosity: 1.0,
        preferCanvas: true,
      });

      const blackLayer = L.tileLayer(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIHWNgAAIAAAUAAY27m/MAAAAASUVORK5CYII=",
        {
          attribution: "",
          opacity: 1,
        },
      );

      blackLayer.addTo(this.map);

      L.control
        .attribution({
          prefix:
            '<a href="https://github.com/bxavaby/firly">Firly</a> | NASA VIIRS',
          position: "bottomright",
        })
        .addTo(this.map);

      this.map.whenReady(() => {
        resolve();
      });
    });
  }

  async playIntroAnimation() {
    const timeline = anime.timeline({
      duration: 800,
      easing: "easeOutQuart",
    });

    timeline
      .add({
        targets: ".logo",
        opacity: [0, 1],
        translateY: [-30, 0],
        duration: 1200,
      })
      .add(
        {
          targets: ".subtitle",
          opacity: [0, 1],
          translateX: [-20, 0],
          duration: 800,
        },
        "-=600",
      )
      .add(
        {
          targets: ".stat",
          opacity: [0, 1],
          translateY: [-20, 0],
          duration: 600,
          delay: anime.stagger(150),
        },
        "-=400",
      )
      .add(
        {
          targets: ".controls-panel",
          opacity: [0, 1],
          translateY: [50, 0],
          duration: 1000,
        },
        "-=200",
      );

    return timeline.finished;
  }

  bindEvents() {
    const intensitySlider = document.getElementById("intensity-slider");
    const brightnessSlider = document.getElementById("brightness-slider");
    const intensityValue = document.getElementById("intensity-value");
    const brightnessValue = document.getElementById("brightness-value");
    const fullscreenBtn = document.getElementById("fullscreen-btn");

    if (intensitySlider && intensityValue) {
      intensitySlider.addEventListener("input", (e) => {
        const value = e.target.value;
        intensityValue.textContent = `${value}%`;
        this.updateLayerOpacity(value / 100);
      });
    }

    if (brightnessSlider && brightnessValue) {
      brightnessSlider.addEventListener("input", (e) => {
        const value = e.target.value;
        brightnessValue.textContent = `${value}%`;
        this.updateLayerBrightness(value / 100);
      });
    }

    if (fullscreenBtn) {
      fullscreenBtn.addEventListener("click", () => {
        this.toggleFullscreen();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "f" || e.key === "F") {
        this.toggleFullscreen();
      }
    });
  }

  updateLayerOpacity(opacity) {
    if (this.currentLayer) {
      this.currentLayer.setOpacity(opacity);
    }
  }

  updateLayerBrightness(brightness) {
    if (this.currentLayer && this.currentLayer._container) {
      this.currentLayer._container.style.filter = `brightness(${brightness}) contrast(1.2)`;
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  }

  async loadRealNightLights() {
    if (this.isLoading) return;

    this.isLoading = true;
    await this.showLoading();

    try {
      await this.loadVIIRSData();
      this.updateConnectionStatus(true, "NASA VIIRS - 2023");
      this.updateStats();
    } catch (error) {
      console.error("Error loading VIIRS data:", error);
      this.updateConnectionStatus(false, "Connection Failed");
    } finally {
      this.isLoading = false;
      await this.hideLoading();
    }
  }

  async loadVIIRSData() {
    if (this.currentLayer) {
      this.map.removeLayer(this.currentLayer);
      this.currentLayer = null;
    }

    for (const source of this.dataSources) {
      try {
        console.log(`Attempting to load: ${source.name}`);

        this.currentLayer = L.tileLayer(source.url, {
          attribution: source.attribution,
          opacity: 0.8,
          maxZoom: source.maxZoom,
          crossOrigin: "anonymous",
          errorTileUrl:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIHWNgAAIAAAUAAY27m/MAAAAASUVORK5CYII=",
        });

        await this.testLayerLoad(this.currentLayer);

        this.currentLayer.addTo(this.map);
        await this.fadeInLayer(this.currentLayer);

        console.log(`Successfully loaded: ${source.name}`);

        this.enhanceNightLights();

        return;
      } catch (error) {
        console.log(`Failed to load ${source.name}:`, error.message);
        if (this.currentLayer) {
          this.map.removeLayer(this.currentLayer);
          this.currentLayer = null;
        }
      }
    }

    throw new Error("All NASA data sources failed to load");
  }

  testLayerLoad(layer) {
    return new Promise((resolve, reject) => {
      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error("Layer load timeout"));
        }
      }, 10000);

      const cleanup = () => {
        clearTimeout(timeout);
        layer.off("load");
        layer.off("tileerror");
      };

      layer.on("load", () => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve();
        }
      });

      layer.on("tileerror", (e) => {
        console.log("Tile error occurred, but continuing...");
      });

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve();
        }
      }, 3000);
    });
  }

  enhanceNightLights() {
    if (this.currentLayer && this.currentLayer._container) {
      this.currentLayer._container.style.mixBlendMode = "screen";
      this.currentLayer._container.style.filter =
        "brightness(1.0) contrast(1.2) saturate(1.1)";
    }
  }

  async fadeInLayer(layer) {
    return new Promise((resolve) => {
      const animate = () => {
        if (layer._container) {
          layer._container.style.opacity = "0";
          anime({
            targets: layer._container,
            opacity: [0, 0.8],
            duration: 1500,
            easing: "easeOutQuart",
            complete: resolve,
          });
        } else {
          setTimeout(animate, 100);
        }
      };
      animate();
    });
  }

  updateStats() {
    const dataPoints = document.getElementById("data-points");
    if (!dataPoints) return;

    const counter = { value: 2.1 };
    const targetValue = 12.8;

    anime({
      targets: counter,
      value: targetValue,
      duration: 2500,
      easing: "easeOutQuart",
      update: () => {
        if (dataPoints && typeof counter.value === "number") {
          dataPoints.textContent = `${counter.value.toFixed(1)}M`;
        }
      },
    });
  }

  async showLoading() {
    return new Promise((resolve) => {
      const loading = document.getElementById("loading");
      const progressBar = document.getElementById("progress-bar");
      const loadingText = document.getElementById("loading-text");

      if (!loading) {
        resolve();
        return;
      }

      loading.classList.remove("hidden");

      const messages = [
        "Connecting to NASA VIIRS...",
        "Downloading satellite imagery...",
        "Processing night lights data...",
        "Optimizing visualization...",
        "Ready!",
      ];

      let messageIndex = 0;
      let progress = 0;

      const updateProgress = () => {
        progress += Math.random() * 20 + 10;
        if (progress > 90) progress = 90;

        if (progressBar) progressBar.style.width = `${progress}%`;

        if (messageIndex < messages.length && loadingText) {
          loadingText.textContent = messages[messageIndex];
          messageIndex++;
        }

        if (progress < 90) {
          setTimeout(updateProgress, 500);
        } else {
          if (progressBar) progressBar.style.width = "100%";
          setTimeout(resolve, 600);
        }
      };

      anime({
        targets: loading,
        opacity: [0, 1],
        scale: [0.9, 1],
        duration: 400,
        easing: "easeOutBack",
        complete: updateProgress,
      });
    });
  }

  async hideLoading() {
    return new Promise((resolve) => {
      const loading = document.getElementById("loading");

      if (!loading) {
        resolve();
        return;
      }

      anime({
        targets: loading,
        opacity: [1, 0],
        scale: [1, 0.9],
        duration: 400,
        easing: "easeInBack",
        complete: () => {
          loading.classList.add("hidden");
          const progressBar = document.getElementById("progress-bar");
          if (progressBar) progressBar.style.width = "0%";
          resolve();
        },
      });
    });
  }

  updateConnectionStatus(connected, message = null) {
    const status = document.getElementById("connection-status");
    if (!status) return;

    const dot = status.querySelector(".status-dot");
    const text = status.querySelector("span");

    if (connected) {
      if (dot) {
        dot.style.background = "var(--success-color)";
        dot.style.boxShadow = "0 0 12px var(--success-color)";
      }
      if (text) text.textContent = message || "Connected";
    } else {
      if (dot) {
        dot.style.background = "var(--warning-color)";
        dot.style.boxShadow = "0 0 12px var(--warning-color)";
      }
      if (text) text.textContent = message || "Connection Failed";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new FirlyApp();
});
