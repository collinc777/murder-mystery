export const CHARACTERS = {
  TRAIN_STAFF: {
    title: "Train Staff",
    members: [
      { 
        name: "MOLLY SNOWFLAKE", 
        role: "Train Driver",
        trait: "Being hyperactive. When she's not driving the train, she moves and talks at a rate that exhausts those around her.",
        appearance: "Smart trousers and blazer style jacket. Shirt and tie. Shined shoes. Train driver's licence pinned to blazer."
      },
      { 
        name: "CHRISTOPHER CAROL", 
        role: "Train Conductor",
        trait: "Constantly trying to be the centre of attention.",
        appearance: "Tight fitting trousers and shirt. Smart shoes, no socks. A nice watch. Enough cologne to choke a reindeer!"
      },
      { 
        name: "NORMAN 'NODDY' SLEIGH", 
        role: "Bad Santa",
        trait: "Swigging alcohol from a hip flask when he thinks nobody is looking.",
        appearance: "Red Santa suit and Santa hat, shiny black boots and belt. Fake white beard. Dishevelled and fatigued."
      },
      { 
        name: "AUGUSTUS PRESENT", 
        role: "Santa's Helper",
        trait: "Daydreaming- he's often startled when people start talking to him.",
        appearance: "Santa's elf style fancy dress. Think- reds and greens. Stripey tights, pointed shoes, and droopy hats."
      },
      { 
        name: "RAIN DEERS", 
        role: "Santa's Helper",
        trait: "Talking like a hippy (she was raised on a hippy commune, after all).",
        appearance: "Santa's elf style fancy dress. Think- reds and greens. Stripey tights, pointed shoes, and droopy hats."
      }
    ]
  },
  TINSLEBOTTOM: {
    title: "The Tinslebottom Family",
    members: [
      { 
        name: "RONALD TINSLEBOTTOM", 
        role: "Family Dad",
        trait: "Telling anyone who will listen about his next big invention/idea.",
        appearance: "Big glasses (he's worn since the 90s). High waisted trousers with tucked in shirt. Scuffed boots. Odd socks. Messy hair."
      },
      { 
        name: "ARABELLA TINSLEBOTTOM", 
        role: "Family Mum",
        trait: "Her gloomy expression – she's known to her friends as Posh Spice.",
        appearance: "Long comfortable dress (preferably patterned). Sensible shoes. A handbag big enough to carry the kitchen sink."
      },
      { 
        name: "RUSSELL TINSLEBOTTOM", 
        role: "Family Son",
        trait: "Disliking other children, unless they speak to him about computers or technology.",
        appearance: "Shorts and t-shirt (in any weather). VR Headset worn on top of head. Two mobile phones."
      }
    ]
  },
  JOLLY: {
    title: "The Jolly Family",
    members: [
      { 
        name: "ANYA JOLLY", 
        role: "Family Mum",
        trait: "Making the news some months ago for throwing a custard pie at her local mayor.",
        appearance: "Tracksuits (particularly velour), simple jogging bottoms and matching hoodies. Trainers/sneakers."
      },
      { 
        name: "LAYLA JOLLY", 
        role: "Family Mum",
        trait: "Multitasking and her direct manner (which can be seen as rude but is, in her mind, simply efficient communication).",
        appearance: "Tracksuits (particularly velour), simple jogging bottoms and matching hoodies. Trainers/sneakers."
      },
      { 
        name: "JAX 'JJ' JOLLY", 
        role: "Family Son",
        trait: "Being laid back. His mums claim that he never ever cried as a baby.",
        appearance: "Tracksuits (particularly velour), simple jogging bottoms and matching hoodies. Trainers/sneakers."
      },
      { 
        name: "SKYLAR JOLLY", 
        role: "Family Daughter",
        trait: "Being a social media celebrity.",
        appearance: "Tracksuits (particularly velour), simple jogging bottoms and matching hoodies. Trainers/sneakers."
      }
    ]
  },
  BAUBLES: {
    title: "The Baubles Family",
    members: [
      { 
        name: "JADE BAUBLES", 
        role: "Family Mum",
        trait: "Her love of Charles Dickens and desire to go back in time to the Victorian era.",
        appearance: "Old fashioned Victorian style dress. Brown leather shoes. Modest handbag. Subtle make-up."
      },
      { 
        name: "OLIVER BAUBLES", 
        role: "Family Son",
        trait: "Leader of the Baubles triplets.",
        appearance: "Smart trousers and scuffed leather shoes. White shirt that gets dirtier as the day wears on. Slicked hair."
      },
      { 
        name: "TIM 'TINY' BAUBLES", 
        role: "Family Son",
        trait: "Smallest of the Baubles triplets.",
        appearance: "Smart trousers and scuffed leather shoes. White shirt that gets dirtier as the day wears on. Slicked hair."
      },
      { 
        name: "MARLEY BAUBLES", 
        role: "Family Son",
        trait: "Smartest of the Baubles triplets.",
        appearance: "Smart trousers and scuffed leather shoes. White shirt that gets dirtier as the day wears on. Slicked hair."
      },
      { 
        name: "ESTELLA BAUBLES", 
        role: "Family Daughter",
        trait: "Being born when her mother was very young. She's often asked if her mother, Jade, is her sister.",
        appearance: "Ripped jeans and grunge/band t-shirt. Black/dark make-up. Necklaces and bracelets."
      }
    ]
  },
  ANGEL: {
    title: "The Angel Family",
    members: [
      { 
        name: "KINGSLEY ANGEL", 
        role: "Family Dad",
        trait: "Holding the record for the world's shortest incarceration- 30 minutes after being wrongly convicted of arson.",
        appearance: "Expensive looking suit, watch and jewellery. On trend sneakers/trainers. Sunglasses (yes, even indoors)."
      },
      { 
        name: "SCARLET ANGEL", 
        role: "Family Mum",
        trait: "Being a famous modern artist- she hates modern art but uses it to make a living whilst she works on her 'true' art.",
        appearance: "Dressed more for the club than for a family day out- short dress, heavy make-up, and fashionable bag. High heeled shoes."
      },
      { 
        name: "KAHLO ANGEL", 
        role: "Family Daughter",
        trait: "Being a spoiled brat.",
        appearance: "Jeans and jumper with huge designer logos. Latest phone and EarPods. Designer trainers/sneakers."
      }
    ]
  }
}

export type CharacterName = typeof CHARACTERS[keyof typeof CHARACTERS]["members"][number]["name"] 