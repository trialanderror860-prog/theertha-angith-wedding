// import childhoodPhoto from "@/assets/theertha-anjith-childhood.jpeg.asset.json";
import openingPhoto from "@/assets/Opening_page_photo.jpeg";
import storyPhoto from "@/assets/Our_story_photo.jpeg";
import dressCodePhoto from "@/assets/dresscode.jpeg";
import childhoodPhoto from "@/assets/our_story_childhood.jpeg";
import closingPhoto from "@/assets/End_page_photo.jpeg";
import venue1Photo from "@/assets/venue_image1.png";
import venue2Photo from "@/assets/venue_image_2.png";
import holdingHandsPhoto from "@/assets/holding_hands.jpeg";

export const wedding = {
  title: "The Odyssey",
  brideName: "Theertha",
  groomName: "Anigith",
  dateIso: "2027-01-10",
  dateTimeLocal: "2027-01-10T11:30:00",
  weekday: "Sunday",
  dateLabel: "10 January 2027",
  timeLabel: "11:30 AM – 12:15 PM",
  storyParagraph:
    "Every journey has a beginning. Ours is made of little moments, unexpected smiles, beautiful memories and a love that continues to grow.",
  venue: {
    name: "M Mukundan Park",
    address: "M Mukundan Park, PG6Q+4WW, Palloor, Mahé, 673312",
    city: "Keralam",
    mapLink: "https://maps.app.goo.gl/6L9pzk7BDmtSoaoo6",
    description: "Find the venue details for where we begin this next chapter.",
  },
  photos: {
    opening: openingPhoto,
    story: storyPhoto,
    childhood: childhoodPhoto,
    dressCode: dressCodePhoto,
    closing: closingPhoto,
    venue1: venue1Photo,
    venue2: venue2Photo,
    holdingHands: holdingHandsPhoto,
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