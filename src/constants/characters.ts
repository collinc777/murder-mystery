export const CHARACTERS = {
  TRAIN_STAFF: {
    title: "Train Staff",
    members: [
      { name: "TRAIN DRIVER", role: "The one who drives the train" },
      { name: "TRAIN CONDUCTOR", role: "The one who checks the tickets" },
      { name: "BAD SANTA", role: "A suspicious Santa figure" },
      { name: "SANTA'S HELPER", role: "Santa's trusted assistant" }
    ]
  },
  TINSLEBOTTOM: {
    title: "The Tinslebottom Family",
    members: [
      { name: "RONALD TINSLEBOTTOM", role: "Family Dad" },
      { name: "ARABELLA TINSLEBOTTOM", role: "Family Mum" },
      { name: "RUSSELL TINSLEBOTTOM", role: "Family Son" }
    ]
  },
  JOLLY: {
    title: "The Jolly Family",
    members: [
      { name: "ANYA JOLLY", role: "Family Mum" },
      { name: "LAYLA JOLLY", role: "Family Mum" },
      { name: "JAX 'JJ' JOLLY", role: "Family Son" },
      { name: "SKYLAR JOLLY", role: "Family Daughter" }
    ]
  },
  BAUBLES: {
    title: "The Baubles Family",
    members: [
      { name: "JADE BAUBLES", role: "Family Mum" },
      { name: "OLIVER BAUBLES", role: "Family Son" },
      { name: "TIM 'TINY' BAUBLES", role: "Family Son" },
      { name: "MARLEY BAUBLES", role: "Family Son" },
      { name: "ESTELLA BAUBLES", role: "Family Daughter" }
    ]
  },
  ANGEL: {
    title: "The Angel Family",
    members: [
      { name: "KINGSLEY ANGEL", role: "Family Dad" },
      { name: "SCARLET ANGEL", role: "Family Mum" },
      { name: "KAHLO ANGEL", role: "Family Daughter" }
    ]
  },
  OTHERS: {
    title: "Other Passengers",
    members: [
      { name: "MOLLY SNOWFLAKE", role: "Mysterious passenger" },
      { name: "CHRISTOPHER CAROL", role: "Cheerful traveler" },
      { name: "NORMAN 'NODDY' SLEIGH", role: "Sleepy passenger" },
      { name: "AUGUSTUS PRESENT", role: "Gift-bearing traveler" }
    ]
  }
}

export type CharacterName = typeof CHARACTERS[keyof typeof CHARACTERS]["members"][number]["name"] 