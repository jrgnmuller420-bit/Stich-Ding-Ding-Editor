export interface AiFilter {
  name: string;
  prompt: string;
  background: string;
}

export const filters: AiFilter[] = [
  {
    name: "Anime",
    prompt: "Zet deze afbeelding om in een levendige, hoogwaardige anime-kunststijl, die de essentie van moderne Japanse animatie vastlegt.",
    background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  },
  {
    name: "Aquarel",
    prompt: "Transformeer deze foto in een delicaat en expressief aquarel-schilderij, met zachte wassingen en zichtbare penseelstreken.",
    background: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
  },
  {
    name: "Cyberpunk",
    prompt: "Herontwerp deze afbeelding met een futuristische cyberpunk-esthetiek, met neonlichten, hightech-elementen en een grimmige, dystopische sfeer.",
    background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  },
  {
    name: "Steampunk",
    prompt: "Teken deze scène opnieuw in een steampunk-stijl, met Victoriaanse esthetiek, industriële, stoom-aangedreven machines en ingewikkelde uurwerkdetails.",
    background: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
  },
  {
    name: "Klei-animatie",
    prompt: "Creëer deze afbeelding opnieuw alsof het een stop-motion klei-animatie scène is, met een duidelijke, handgemaakte kleitextuur en licht overdreven kenmerken.",
    background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  },
  {
    name: "Vintage",
    prompt: "Geef deze foto een vintage, ouderwetse uitstraling, met vervaagde kleuren, filmkorrel en een nostalgisch, retro gevoel dat doet denken aan de jaren '60.",
    background: 'linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%)',
  }
];
