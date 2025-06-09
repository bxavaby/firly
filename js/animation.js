class FirlyAnimations {
  static fadeInLayer(layer) {
    if (!layer._container) return;

    // Start with opacity 0
    layer._container.style.opacity = "0";

    // Animate to full opacity
    anime({
      targets: layer._container,
      opacity: [0, 0.8],
      duration: 1000,
      easing: "easeOutQuart",
    });
  }

  static pulseEffect(element) {
    anime({
      targets: element,
      scale: [1, 1.1, 1],
      opacity: [0.8, 1, 0.8],
      duration: 2000,
      loop: true,
      easing: "easeInOutSine",
    });
  }

  static slideTransition(fromElement, toElement) {
    const timeline = anime.timeline({
      duration: 800,
      easing: "easeInOutQuart",
    });

    timeline
      .add({
        targets: fromElement,
        translateX: [-100, 0],
        opacity: [1, 0],
      })
      .add(
        {
          targets: toElement,
          translateX: [100, 0],
          opacity: [0, 1],
        },
        "-=400",
      );
  }

  static glowHotspots(coordinates) {
    // Future implementation for highlighting bright areas
    coordinates.forEach((coord) => {
      // Add glowing markers for major cities/bright areas
    });
  }
}
