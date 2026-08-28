// Dinosaur Database with Jurassic World Alive creatures
const DINOSAURS = {
    // Non-Hybrid Dinosaurs
    tyrannosaurus: {
        name: "Tyrannosaurus Rex",
        rarity: "Legendary",
        health: 150,
        attack: 35,
        speed: 2,
        threat: 100,
        image: "🦖",
        description: "The king of dinosaurs. Extremely aggressive and deadly.",
        arModel: "t-rex-model"
    },
    triceratops: {
        name: "Triceratops",
        rarity: "Epic",
        health: 120,
        attack: 25,
        speed: 2.5,
        threat: 75,
        image: "🦕",
        description: "A powerful herbivore with massive horns.",
        arModel: "triceratops-model"
    },
    velociraptor: {
        name: "Velociraptor",
        rarity: "Epic",
        health: 80,
        attack: 20,
        speed: 4,
        threat: 70,
        image: "🦕",
        description: "Fast, intelligent, and hunts in packs.",
        arModel: "velociraptor-model"
    },
    brachiosaurus: {
        name: "Brachiosaurus",
        rarity: "Rare",
        health: 180,
        attack: 15,
        speed: 1.5,
        threat: 60,
        image: "🦕",
        description: "Massive herbivore. Rarely aggressive unless provoked.",
        arModel: "brachiosaurus-model"
    },
    stegosaurus: {
        name: "Stegosaurus",
        rarity: "Rare",
        health: 110,
        attack: 22,
        speed: 2,
        threat: 65,
        image: "🦕",
        description: "Defensive herbivore with sharp tail plates.",
        arModel: "stegosaurus-model"
    },
    ankylosaurus: {
        name: "Ankylosaurus",
        rarity: "Epic",
        health: 140,
        attack: 18,
        speed: 1.8,
        threat: 70,
        image: "🦕",
        description: "Armored herbivore with a deadly club tail.",
        arModel: "ankylosaurus-model"
    },
    spinosaurus: {
        name: "Spinosaurus",
        rarity: "Legendary",
        health: 160,
        attack: 32,
        speed: 2.2,
        threat: 95,
        image: "🦖",
        description: "Larger and more dangerous than T-Rex. Semi-aquatic predator.",
        arModel: "spinosaurus-model"
    },
    parasaurolophus: {
        name: "Parasaurolophus",
        rarity: "Common",
        health: 70,
        attack: 12,
        speed: 3,
        threat: 40,
        image: "🦕",
        description: "Herbivore with a distinctive crest. Herd animal.",
        arModel: "parasaurolophus-model"
    },
    gallimimus: {
        name: "Gallimimus",
        rarity: "Common",
        health: 50,
        attack: 8,
        speed: 5,
        threat: 30,
        image: "🦕",
        description: "Fleet-footed herbivore. Travels in herds.",
        arModel: "gallimimus-model"
    },
    compsognathus: {
        name: "Compsognathus",
        rarity: "Uncommon",
        health: 40,
        attack: 10,
        speed: 4.5,
        threat: 35,
        image: "🦕",
        description: "Small but quick carnivore.",
        arModel: "compsognathus-model"
    },
    iguanodon: {
        name: "Iguanodon",
        rarity: "Uncommon",
        health: 90,
        attack: 16,
        speed: 2.8,
        threat: 50,
        image: "🦕",
        description: "Intelligent herbivore that can walk on two or four legs.",
        arModel: "iguanodon-model"
    },
    dilophosaurus: {
        name: "Dilophosaurus",
        rarity: "Uncommon",
        health: 85,
        attack: 19,
        speed: 3.2,
        threat: 55,
        image: "🦕",
        description: "Carnivore with a distinctive double crest.",
        arModel: "dilophosaurus-model"
    },

    // Hybrid Dinosaurs (Only 2 allowed)
    indominus_rex: {
        name: "Indominus Rex",
        rarity: "Unique",
        health: 200,
        attack: 45,
        speed: 3.5,
        threat: 150,
        image: "🦖",
        description: "Hybrid creature: part T-Rex, part Raptor. Intelligent and deadly.",
        isHybrid: true,
        arModel: "indominus-rex-model"
    },
    indoraptor: {
        name: "Indoraptor",
        rarity: "Unique",
        health: 140,
        attack: 40,
        speed: 4.5,
        threat: 140,
        image: "🦖",
        description: "Hybrid creature: enhanced Velociraptor. Extremely intelligent and lethal.",
        isHybrid: true,
        arModel: "indoraptor-model"
    }
};

// Wave Configurations
const WAVES = [
    {
        wave: 1,
        dinosaurs: ["parasaurolophus", "gallimimus", "compsognathus"],
        difficulty: 0.8
    },
    {
        wave: 2,
        dinosaurs: ["dilophosaurus", "velociraptor", "gallimimus"],
        difficulty: 1.0
    },
    {
        wave: 3,
        dinosaurs: ["iguanodon", "stegosaurus", "parasaurolophus"],
        difficulty: 1.2
    },
    {
        wave: 4,
        dinosaurs: ["velociraptor", "velociraptor", "triceratops"],
        difficulty: 1.4
    },
    {
        wave: 5,
        dinosaurs: ["spinosaurus", "ankylosaurus", "gallimimus"],
        difficulty: 1.6
    },
    {
        wave: 6,
        dinosaurs: ["tyrannosaurus", "velociraptor", "dilophosaurus"],
        difficulty: 1.8
    },
    {
        wave: 7,
        dinosaurs: ["indominus_rex"],
        difficulty: 2.2
    },
    {
        wave: 8,
        dinosaurs: ["indoraptor", "tyrannosaurus", "spinosaurus"],
        difficulty: 2.5
    }
];

// Get dinosaur by ID
function getDinosaur(id) {
    return DINOSAURS[id];
}

// Get wave data
function getWave(waveNumber) {
    return WAVES[waveNumber - 1] || WAVES[WAVES.length - 1];
}

// Spawn dinosaur with properties
function spawnDinosaur(dinosaurId) {
    const dino = getDinosaur(dinosaurId);
    return {
        id: dinosaurId,
        ...dino,
        currentHealth: dino.health,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        angle: Math.random() * 360
    };
}
