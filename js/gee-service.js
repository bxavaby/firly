class GEEService {
  constructor() {
    this.ee = null;
    this.isInitialized = false;
    this.map = null;
  }

  async initialize() {
    try {
      await new Promise((resolve, reject) => {
        ee.initialize(
          null,
          () => {
            console.log("Earth Engine initialized successfully");
            this.ee = ee;
            this.isInitialized = true;
            resolve();
          },
          (error) => {
            console.error("Earth Engine initialization failed:", error);
            reject(error);
          },
        );
      });
    } catch (error) {
      console.error("Failed to initialize GEE:", error);
      throw error;
    }
  }

  async getNightLightsData(year = 2025, month = null) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const startDate = month
        ? `${year}-${month.toString().padStart(2, "0")}-01`
        : `${year}-01-01`;
      const endDate = month
        ? `${year}-${month.toString().padStart(2, "0")}-28`
        : `${year}-12-31`;

      console.log(`Loading VIIRS data from ${startDate} to ${endDate}`);

      const dataset = ee
        .ImageCollection("NASA/VIIRS/002/VNP46A2")
        .filter(ee.Filter.date(startDate, endDate))
        .select("Gap_Filled_DNB_BRDF_Corrected_NTL");

      const nightLights = dataset.median();

      const visParams = {
        min: 0,
        max: 50,
        palette: [
          "000000",
          "0D0887",
          "46039F",
          "7201A8",
          "9C179E",
          "BD3786",
          "D8576B",
          "ED7953",
          "FB9F3A",
          "FDCA26",
          "F0F921",
        ],
      };

      return { image: nightLights, visParams };
    } catch (error) {
      console.error("Error fetching night lights data:", error);
      throw error;
    }
  }

  async createMap(mapElement, centerLat = 25, centerLon = 15, zoom = 3) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    this.map = ee.Map.create(mapElement, {
      center: [centerLat, centerLon],
      zoom: zoom,
      style: "DARK",
    });

    return this.map;
  }

  async addNightLightsLayer(year = 2025, intensity = 0.8) {
    if (!this.map) {
      throw new Error("Map not initialized");
    }

    try {
      const { image, visParams } = await this.getNightLightsData(year);

      const adjustedParams = {
        ...visParams,
        max: visParams.max * intensity,
      };

      this.map.addLayer(image, adjustedParams, `Night Lights ${year}`, true);

      return true;
    } catch (error) {
      console.error("Error adding night lights layer:", error);
      throw error;
    }
  }

  updateIntensity(intensity) {
    if (this.map) {
      this.map.clear();
      this.addNightLightsLayer(2025, intensity);
    }
  }
}

export default GEEService;
