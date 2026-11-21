import childhoodPhoto from "@/assets/theertha-anjith-childhood.jpeg.asset.json";
import openingPhoto from "@/assets/theertha-anjith-opening.jpeg.asset.json";
import storyPhoto from "@/assets/theertha-anjith-story.jpeg.asset.json";
import dressCodePhoto from "@/assets/wedding-dress-code.jpeg.asset.json";

export const wedding = {
  title: "The Odyssey",
  brideName: "Theertha",
  groomName: "Anjith",
  dateIso: "2027-01-10",
  dateTimeLocal: "2027-01-10T11:30:00",
  weekday: "Sunday",
  dateLabel: "10 January 2027",
  timeLabel: "11:30 AM – 12:15 PM",
  storyParagraph:
    "Every journey has a beginning. Ours is made of little moments, unexpected smiles, beautiful memories and a love that continues to grow.",
  venue: {
    name: "",
    address: "",
    city: "",
    mapLink: "",
    description: "",
  },
  photos: {
    opening: openingPhoto.url,
    story: storyPhoto.url,
    childhood: childhoodPhoto.url,
    dressCode: dressCodePhoto.url,
    closing: openingPhoto.url,
  },
  palette: [
    { name: "Deep Olive", hex: "#76783E", swatchClass: "bg-olive-deep" },
    { name: "Olive Green", hex: "#7A863F", swatchClass: "bg-olive-green" },
    { name: "Moss Green", hex: "#96A12F", swatchClass: "bg-moss-green" },
    { name: "Sage Green", hex: "#C5D187", swatchClass: "bg-sage-green" },
    { name: "Mustard Yellow", hex: "#D4C01E", swatchClass: "bg-mustard-yellow" },
    { name: "Bright Soft Yellow", hex: "#F3D51D", swatchClass: "bg-bright-yellow" },
    { name: "Pastel Yellow", hex: "#F5DE83", swatchClass: "bg-pastel-yellow" },
    { name: "Warm Cream", hex: "#FFF3CA", swatchClass: "bg-warm-cream" },
  ],
} as const;