export interface GuideSection {
  heading: string;
  body: string;
  tip?: string;
  imageUrl?: string | null;
}

export interface RecommendedVehicle {
  id: string;
  name: string;
  reason: string;
}

export interface Guide {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  country: string;
  flag: string;
  readTime: string;
  coverGradient: string;
  accentColor: string;
  tags: string[];
  intro: string;
  sections: GuideSection[];
  recommendedVehicles: RecommendedVehicle[];
  practicalInfo: { label: string; value: string }[];
  bestMonths: string;
  difficulty: string;
  ctaText: string;
}

export const guides: Guide[] = [
  {
    slug: "gorilla-trekking-uganda",
    title: "Gorilla Trekking in Uganda",
    subtitle: "A Complete Self-Drive & Chauffeur Guide to Bwindi Impenetrable Forest",
    category: "Wildlife Safari",
    country: "Uganda",
    flag: "🇺🇬",
    readTime: "8 min read",
    coverGradient: "from-emerald-950 via-green-900 to-emerald-800",
    accentColor: "text-emerald-400",
    tags: ["Gorilla Trekking", "4x4 Required", "Bwindi", "Chauffeur Recommended", "Permit Needed"],
    intro:
      "Mountain gorilla trekking in Uganda's Bwindi Impenetrable Forest is one of the most extraordinary wildlife encounters on earth. Only around 1,000 mountain gorillas exist in the wild, and Uganda is home to more than half of them. Getting to Bwindi requires serious preparation — both in terms of permits and transport. This guide covers everything from the drive from Kampala to what to expect in the forest.",
    sections: [
      {
        heading: "Getting to Bwindi from Kampala",
        body:
          "The drive from Kampala to Bwindi covers approximately 480km (8–10 hours depending on route and road conditions). The route passes through Mbarara and Kabale before climbing into the misty highlands of Kisoro district. The final 50km from Kabale to Bwindi is a gravel mountain road — steep, narrow, and sometimes deeply rutted after rain. A high-clearance 4x4 is absolutely essential for this stretch. We strongly recommend departing Kampala no later than 6:00 AM to reach your lodge before dark.",
        tip:
          "Stop for lunch at the Highland Bakery in Kabale — it's the last decent meal stop before Bwindi, and the town itself sits at 1,870m with spectacular views of the crater lakes.",
      },
      {
        heading: "The Two Main Trekking Sectors",
        body:
          "Bwindi has four habituated gorilla family sectors: Buhoma (north), Ruhija (east), Rushaga (south), and Nkuringo (southwest). Buhoma is the most developed with the widest range of lodge options. Rushaga hosts the most gorilla families and is best for Habituation Experiences (full-day visits). Nkuringo sits on a ridge at 2,300m and involves a steep descent and ascent. Each sector requires a different approach road — confirm your sector before planning your route.",
      },
      {
        heading: "The Trek Itself",
        body:
          "Permits cost $700 per person per day and are booked through the Uganda Wildlife Authority. Treks begin at 8:00 AM and can last anywhere from 1 to 8 hours depending on where the gorilla family has moved overnight. Guides track the group daily and radio ahead with their position. You'll spend exactly one hour with the gorillas once found — the most intense, humbling 60 minutes of your life. Pack waterproof hiking boots, rain gear, and long sleeves to protect against nettles and insects.",
        tip:
          "Hire a porter at the park gate ($15). They carry your bag, act as a second guide, and the income goes directly to local communities — it's the best $15 you'll spend.",
      },
      {
        heading: "Where to Stay",
        body:
          "Accommodation ranges from luxury lodges (Bwindi Lodge, Mahogany Springs) to mid-range options (Gorilla Resort, Ruhija Gorilla Friends) and community guesthouses. Booking 6–12 months in advance is strongly recommended for peak season (June–September, December–February). Most lodges include meals and can arrange transfers — but having your own vehicle gives you flexibility to explore the surrounding communities and scenic viewpoints.",
      },
      {
        heading: "Combining Bwindi with Queen Elizabeth NP",
        body:
          "Many visitors combine Bwindi with Queen Elizabeth National Park — famous for its tree-climbing lions in Ishasha and boat safaris on the Kazinga Channel. The drive from Bwindi to Ishasha takes approximately 2.5 hours via Kihihi on a rough dirt road — again, 4x4 essential. From Ishasha, Queen Elizabeth's main circuit is another 2 hours north. This combination route makes for an exceptional 7–10 day Uganda safari.",
      },
    ],
    recommendedVehicles: [
      {
        id: "lc200",
        name: "Toyota Land Cruiser V8",
        reason: "The gold standard for mountain road driving. Full-time 4x4 with low-range, 8 seats, and ample cargo space for multi-day safari luggage.",
      },
      {
        id: "prado",
        name: "Toyota Prado",
        reason: "Excellent for couples or small groups. More nimble on narrow mountain tracks, powerful enough for any gradient Bwindi throws at you.",
      },
      {
        id: "safari-van",
        name: "Safari Van (Popup Roof)",
        reason: "Ideal for groups of 6+. The popup roof is perfect for wildlife spotting at Queen Elizabeth NP, and the van handles forest roads well.",
      },
    ],
    practicalInfo: [
      { label: "Gorilla Permit Cost", value: "$700 per person" },
      { label: "Booking Authority", value: "Uganda Wildlife Authority" },
      { label: "Permit Lead Time", value: "3–12 months in advance" },
      { label: "Trek Duration", value: "1–8 hours (1 hr with gorillas)" },
      { label: "Drive from Kampala", value: "8–10 hours (480km)" },
      { label: "Minimum Fitness Level", value: "Moderate — steep terrain" },
    ],
    bestMonths: "June–September & December–February",
    difficulty: "Moderate–Strenuous",
    ctaText: "Book a 4x4 for Your Gorilla Trek",
  },
  {
    slug: "serengeti-safari-routes",
    title: "Serengeti Safari Routes",
    subtitle: "How to Plan the Perfect Self-Drive or Guided Safari Across Tanzania's Greatest Park",
    category: "Game Drive",
    country: "Tanzania",
    flag: "🇹🇿",
    readTime: "10 min read",
    coverGradient: "from-amber-950 via-orange-900 to-amber-800",
    accentColor: "text-amber-400",
    tags: ["Big Five", "Great Migration", "Self-Drive", "Arusha Gateway", "Ngorongoro Combo"],
    intro:
      "The Serengeti. The name alone conjures images of endless golden plains, thundering wildebeest, and lions resting in acacia shade. Tanzania's most celebrated national park covers 14,763km² and offers some of the greatest wildlife spectacles on earth — including the annual Great Migration, one of nature's last great mass movements. This guide covers the key circuits, best timings, and how to make the most of your Serengeti journey from Arusha.",
    sections: [
      {
        heading: "Getting to the Serengeti from Arusha",
        body:
          "Most Serengeti safaris begin in Arusha — the safari capital of Tanzania. From Arusha, you have two options: fly directly to one of the park airstrips (Seronera, Grumeti, Kogatende) or drive. The drive from Arusha to the Naabi Hill Gate (southeast entrance) takes approximately 8 hours via Ngorongoro, passing through the Ngorongoro Conservation Area with its own extraordinary wildlife. The road is tarmac until Ngorongoro then transitions to gravel. Budget your first night at a lodge near the gate.",
        tip:
          "If you drive in, combine with a half-day in Ngorongoro Crater — you're passing anyway, and the crater is one of the world's great wildlife venues. A day pass is around $60 per person.",
      },
      {
        heading: "The Seronera Valley — Year-Round Wildlife Hub",
        body:
          "The central Seronera Valley is the Serengeti's most reliable zone for wildlife, with year-round resident populations of lions, leopards, cheetahs, elephants, and hippos along the Seronera River. This is the best area for first-time visitors and for self-drive safari, as the circuit roads are well-maintained and well-marked. The valley is busy during peak season (July–October) but the sheer scale of the park means solitude is always achievable.",
      },
      {
        heading: "Following the Great Migration",
        body:
          "The Great Migration is a year-round cycle of over 1.5 million wildebeest, 200,000 zebras, and 300,000 Thomson's gazelles circling the Serengeti and Masai Mara ecosystem. December–March: calving season on the southern plains near Ndutu — thousands of calves born daily, attracting massive predator concentrations. April–June: the herds move north through the western corridor. July–October: dramatic Mara River crossings in the north near Kogatende — the most iconic wildlife spectacle on earth. November: the return south begins.",
        tip:
          "For river crossings, position yourself at the Mara River by 6:30 AM. Crossings are unpredictable — spend a full day at the river rather than rushing between locations.",
      },
      {
        heading: "Self-Drive vs. Guided Safari",
        body:
          "Self-drive safari in the Serengeti is legal and very rewarding for experienced travellers. You'll need a reliable 4x4 with high clearance, a GPS-loaded map (or offline Maps.me/AllTrails), and a thorough understanding of park rules. Guided safari offers ranger expertise, radio communication between guides on wildlife sightings, and local knowledge that dramatically improves your game viewing. NOVACAR offers both: self-drive vehicle rental and fully-guided safari packages with experienced local naturalist-drivers.",
      },
      {
        heading: "Combining with Ngorongoro & Tarangire",
        body:
          "The northern Tanzania circuit — Serengeti, Ngorongoro, Tarangire, and optionally Lake Manyara — is the classic 7–10 day Tanzania safari. Tarangire is underrated, with spectacular baobab landscapes and Africa's highest concentration of elephants. Ngorongoro Crater is a UNESCO World Heritage Site with a permanently enclosed Big Five population. Plan your route to minimise backtracking: Arusha → Tarangire → Lake Manyara → Ngorongoro → Serengeti → fly out from a Serengeti airstrip.",
      },
    ],
    recommendedVehicles: [
      {
        id: "safari-van",
        name: "Safari Van (Popup Roof)",
        reason: "The Serengeti standard. Popup roof allows full 360° game viewing for groups. Seats 7 comfortably with luggage storage for multi-day camping gear.",
      },
      {
        id: "lc200",
        name: "Toyota Land Cruiser V8",
        reason: "The prestige self-drive choice. Outstanding ground clearance for wet season tracks, powerful enough for any terrain, and spacious enough for a week of luggage.",
      },
      {
        id: "fortuner",
        name: "Toyota Fortuner",
        reason: "Best value for couples or families of 4. Reliable, well-equipped, and handles Serengeti tracks easily without the bulk of a full-size Land Cruiser.",
      },
    ],
    practicalInfo: [
      { label: "Park Entry Fee", value: "$70 per person/day" },
      { label: "Vehicle Fee", value: "$50 per vehicle/day" },
      { label: "Drive from Arusha", value: "8 hours to Naabi Gate" },
      { label: "Recommended Stay", value: "3–5 nights minimum" },
      { label: "Speed Limit In-Park", value: "50 km/h (strictly enforced)" },
      { label: "Self-Drive Rule", value: "Must stay on designated tracks" },
    ],
    bestMonths: "July–October (migration) & December–March (calving)",
    difficulty: "Easy — suitable for all fitness levels",
    ctaText: "Book Your Serengeti Safari Vehicle",
  },
  {
    slug: "kigali-city-guide",
    title: "Kigali City Guide",
    subtitle: "Africa's Cleanest Capital — What to See, Eat, and Drive",
    category: "City Guide",
    country: "Rwanda",
    flag: "🇷🇼",
    readTime: "6 min read",
    coverGradient: "from-blue-950 via-indigo-900 to-blue-800",
    accentColor: "text-blue-400",
    tags: ["Kigali", "City Break", "Airport Transfer", "Executive", "Weekend Getaway"],
    intro:
      "Kigali defies every cliché about African cities. It's clean — extraordinarily clean — with manicured roundabouts, orderly traffic, and a skyline of glass towers rising above rolling green hills. Rwanda's capital is rapidly becoming one of Africa's premier business and tourism hubs, with world-class hotels, a vibrant food scene, and a thoughtful memorial culture that is both sobering and inspiring. Whether you're here for a layover or a long weekend, having your own vehicle transforms the Kigali experience.",
    sections: [
      {
        heading: "Arriving in Kigali — Airport to City",
        body:
          "Kigali International Airport sits just 10km from the city centre — about 20 minutes without traffic, up to 45 minutes during peak hours (7–9 AM and 5–7 PM). The airport is modern, efficient, and one of the best in sub-Saharan Africa. NOVACAR offers meet-and-greet airport transfers with your name on a board at arrivals — the smoothest introduction to Rwanda you can have. Our executive vehicles (Mercedes E-Class, BMW 5 Series) are particularly popular with business travellers.",
        tip:
          "Kigali has strict plastic bag regulations — all plastic bags are banned. Don't bring them through customs. Declare any at the border — they'll be confiscated.",
      },
      {
        heading: "Kigali Genocide Memorial",
        body:
          "The Kigali Genocide Memorial is the most important stop in the city — a deeply moving, impeccably curated site that honours the 1994 genocide and documents its history. Allow 2–3 hours, and prepare yourself emotionally. The memorial is located in Gisozi district and is open Tuesday–Sunday. Combined with the nearby Inema Arts Centre (one of Kigali's finest contemporary art galleries), this makes for a deeply rich half-day.",
      },
      {
        heading: "Nyamirambo & Local Kigali",
        body:
          "For the most authentic Kigali experience, spend a morning in Nyamirambo — the city's most characterful neighbourhood, a busy Muslim quarter with street food vendors, tailors, and the best samosas in the country. The Nyamirambo Women's Centre offers excellent walking tours led by local women, covering neighbourhood history, craft, and cooking. Inzora Rooftop is the best spot for a sundowner overlooking the city's famous seven hills.",
        tip:
          "Kigali is extremely walkable in the central Kiyovu and Remera areas, but the city's hills make a car essential for moving between districts efficiently — especially in the evening.",
      },
      {
        heading: "Day Trips from Kigali",
        body:
          "Kigali's position in the heart of Rwanda makes it an excellent base for day trips. Volcanoes National Park (gorilla trekking) is 2.5 hours northwest. Lake Kivu's southern shore (Gisenyi/Rubavu) is 2.5 hours west — one of Africa's most beautiful lakes, perfect for a lazy beach day. Akagera National Park (Big Five safaris) is 2.5 hours east. The genocide memorial sites of Ntarama and Nyamata are 30km south and provide sobering historical context. Each destination is easily done as a day trip with NOVACAR.",
      },
      {
        heading: "Where to Eat & Stay",
        body:
          "Kigali's dining scene has exploded. Top picks: Repub Lounge (best nyama choma in the city), The Manor Hotel Restaurant (fine dining, excellent wine list), Café Iwacu (traditional Rwandan cuisine, great for lunch), and Primus Beer Garden in Nyamirambo (cold local lager, local atmosphere). For accommodation, the Marriott Kigali and Radisson Blu are the business-class standard. The Retreat by Heaven is boutique and beautiful.",
      },
    ],
    recommendedVehicles: [
      {
        id: "mercedes",
        name: "Mercedes E-Class",
        reason: "The business-class choice for Kigali. Immaculate exterior, premium interior, and the right impression for client meetings and diplomatic travel.",
      },
      {
        id: "camry",
        name: "Toyota Camry",
        reason: "Smart, comfortable, and practical for city use. Perfect for families or professionals who want reliability and comfort without VIP pricing.",
      },
      {
        id: "lc200",
        name: "Toyota Land Cruiser V8",
        reason: "Best if you're combining Kigali with day trips to Volcanoes NP or Akagera — handles both city streets and forest roads with equal ease.",
      },
    ],
    practicalInfo: [
      { label: "Airport to City", value: "10km — 20–45 min" },
      { label: "Local Currency", value: "Rwandan Franc (RWF)" },
      { label: "Official Languages", value: "Kinyarwanda, French, English" },
      { label: "Plastic Bags", value: "Strictly banned — leave at border" },
      { label: "Driving Side", value: "Right-hand side" },
      { label: "Visa", value: "EAC visitors: visa on arrival or e-visa" },
    ],
    bestMonths: "June–September & December–February (dry seasons)",
    difficulty: "Easy — well-paved city roads",
    ctaText: "Book an Airport Transfer or City Vehicle",
  },
  {
    slug: "volcanoes-national-park",
    title: "Volcanoes National Park",
    subtitle: "Rwanda's Gorilla Heartland — From Musanze to the Misty Peaks",
    category: "Wildlife Safari",
    country: "Rwanda",
    flag: "🇷🇼",
    readTime: "7 min read",
    coverGradient: "from-green-950 via-teal-900 to-green-800",
    accentColor: "text-teal-400",
    tags: ["Gorilla Trekking", "Golden Monkeys", "Dian Fossey", "Musanze", "Volcano Hike"],
    intro:
      "Volcanoes National Park in northwestern Rwanda is one of the most compelling wildlife destinations in Africa. Part of the Virunga Massif — a chain of eight volcanoes spanning Rwanda, Uganda, and the DRC — the park is home to ten habituated mountain gorilla families and offers some of the most accessible gorilla trekking in the world. Add golden monkey tracking, Dian Fossey's research grave, and the option to hike Bisoke's crater lake, and you have one of Africa's most rewarding two-day itineraries.",
    sections: [
      {
        heading: "Getting There from Kigali",
        body:
          "The drive from Kigali to Musanze (the gateway town for Volcanoes NP) covers approximately 110km and takes about 2–2.5 hours on well-paved road. The route is one of Rwanda's most scenic, climbing through tea estates and terraced hillsides. Musanze itself is a pleasant, busy town with good accommodation and restaurants. The park headquarters at Kinigi is a further 15 minutes from Musanze — this is where your trek begins at 7:00 AM.",
        tip:
          "Arrive in Musanze the evening before your trek to avoid an early morning rush. The drive from Kigali in darkness is unnecessary — Musanze has excellent guesthouses at all price points.",
      },
      {
        heading: "Gorilla Permits & Families",
        body:
          "Rwanda gorilla permits cost $1,500 per person — the most expensive in the region, but the experience is the most developed. Permits can be booked through the Rwanda Development Board (RDB). There are ten habituated families, each visited by a maximum of 8 people per day. Popular families include Susa (largest, longest hike), Amahoro (gentlest family), and Hirwa (known for playful juveniles). The RDB assigns families based on group size and fitness level.",
      },
      {
        heading: "Golden Monkey Tracking",
        body:
          "Golden monkey tracking is a wonderful, underrated alternative (or addition) to gorilla trekking. These vivid orange-and-black primates live in the bamboo forests at lower elevation and are extremely habituated — encounters are often close, playful, and at eye level. Permits cost $100 per person, treks take 2–4 hours, and same-day combination (gorillas in the morning, golden monkeys in the afternoon) is possible for serious wildlife enthusiasts.",
      },
      {
        heading: "The Dian Fossey Hike",
        body:
          "Karisoke Research Centre — founded by Dian Fossey in 1967 and the subject of the film Gorillas in the Mist — sits at 3,000m on the slopes of Karisimbi and Visoke volcanoes. The hike to Fossey's grave and the original camp takes 3–4 hours return and passes through spectacular montane forest. The hike is guided, costs around $75, and departs from the park headquarters. It's one of the most atmospheric walks in Africa.",
        tip:
          "Bring trekking poles and waterproofs — the forest above 2,500m is almost always wet and steep. A good pair of hiking gaiters is worth their weight in gold.",
      },
    ],
    recommendedVehicles: [
      {
        id: "lc200",
        name: "Toyota Land Cruiser V8",
        reason: "Recommended for the Kinigi road in wet season and for exploring the park surroundings and community projects beyond the main tarmac.",
      },
      {
        id: "rav4",
        name: "Toyota RAV4",
        reason: "Perfect for the Kigali–Musanze run and Kinigi approach. Compact enough for town parking in Musanze, comfortable on the well-paved highway.",
      },
      {
        id: "camry",
        name: "Toyota Camry",
        reason: "Excellent for comfortable, stylish travel on the main Kigali–Musanze road for those not planning off-road detours.",
      },
    ],
    practicalInfo: [
      { label: "Gorilla Permit Cost", value: "$1,500 per person" },
      { label: "Golden Monkey Permit", value: "$100 per person" },
      { label: "Drive from Kigali", value: "2–2.5 hours (110km)" },
      { label: "Trek Start Time", value: "7:00 AM at Kinigi HQ" },
      { label: "Group Size Limit", value: "8 people per gorilla family" },
      { label: "Minimum Age", value: "15 years for gorilla trekking" },
    ],
    bestMonths: "June–September & December–February",
    difficulty: "Moderate–Strenuous (altitude & steep terrain)",
    ctaText: "Book Your Vehicle to Volcanoes NP",
  },
  {
    slug: "kampala-to-lake-victoria",
    title: "Kampala & Lake Victoria Explorer",
    subtitle: "City Highlights, Island Escapes & the Source of the Nile",
    category: "City & Nature",
    country: "Uganda",
    flag: "🇺🇬",
    readTime: "7 min read",
    coverGradient: "from-sky-950 via-blue-900 to-sky-800",
    accentColor: "text-sky-400",
    tags: ["Kampala", "Lake Victoria", "Source of the Nile", "Ssese Islands", "Entebbe"],
    intro:
      "Uganda's capital Kampala is a city of seven hills — chaotic, colourful, and full of energy. Paired with the vast expanse of Lake Victoria (the world's second-largest freshwater lake) and the legendary Source of the Nile at Jinja, the Kampala region offers an exciting mix of urban culture, history, and natural spectacle. This guide covers the essential Kampala itinerary and the best day trips within reach by road.",
    sections: [
      {
        heading: "Navigating Kampala",
        body:
          "Kampala's traffic is legendary — the city's hills channel vehicles onto a handful of bottleneck roads, and rush hours (7–9 AM and 4–7 PM) can turn a 10km journey into a 90-minute ordeal. Having a local driver who knows the backstreet shortcuts is genuinely valuable. Key areas: Nakasero (government, upscale hotels), Kololo (restaurants, cafés, expat community), Old Kampala (Lubiri palace, Uganda Museum, mosques), and Kisementi (boutique shopping, Café Javas).",
        tip:
          "Download the Kampala traffic layer on Google Maps before arriving. Boda-bodas (motorcycle taxis) weave through traffic faster than cars — use them for short hops when your driver is stuck.",
      },
      {
        heading: "Must-See Kampala Sites",
        body:
          "The Uganda Museum (oldest in East Africa) covers anthropology, natural history, and traditional musical instruments — allow 2 hours. Kasubi Tombs, a UNESCO World Heritage Site, are the burial grounds of the Buganda Kingdom's Kabakas — an extraordinary living cultural site. Namugongo Martyrs' Shrine is a powerful and beautifully designed memorial to the 22 Catholic martyrs executed in 1886. The Buganda Palace (Lubiri) is the current seat of the Buganda Kingdom and offers guided tours.",
      },
      {
        heading: "Day Trip: Jinja and the Source of the Nile",
        body:
          "Jinja sits 85km east of Kampala (about 2 hours by road) and marks the point where the Nile exits Lake Victoria to begin its 6,695km journey to the Mediterranean. The Source of the Nile is a short boat trip from Jinja town and is one of the world's great geographical landmarks. Jinja itself is an adventure sports hub — white-water rafting, bungee jumping over the Nile, and kayaking are all on offer. Stay for a night and watch the sunset over the Nile from the Nile Breweries waterfront.",
      },
      {
        heading: "Day Trip: Entebbe & the Lake Victoria Islands",
        body:
          "Entebbe is 40km south of Kampala on a peninsula jutting into Lake Victoria. The Uganda Wildlife Education Centre (essentially a wildlife rescue zoo) is excellent, with chimpanzees, lions, and shoebill storks. The Entebbe Botanical Gardens, established in 1898, are serene and beautiful. From Entebbe, ferry services run to the Ssese Islands — an archipelago of 84 islands with quiet beaches, forest trails, and one of the best off-grid escapes in East Africa. A two-night island stay is highly recommended.",
        tip:
          "The MV Kalangala ferry from Port Bell runs three times a week. For Ssese, book the RECO ferry from Nakiwogo landing site in Entebbe — it leaves at 2 PM and arrives around 5 PM.",
      },
    ],
    recommendedVehicles: [
      {
        id: "camry",
        name: "Toyota Camry",
        reason: "The smart choice for urban Kampala — comfortable for long waits in traffic, easy to park in the city, and smart enough for business meetings.",
      },
      {
        id: "fortuner",
        name: "Toyota Fortuner",
        reason: "Ideal if you're combining Kampala with day trips to Jinja or Murchison — comfortable on tarmac and capable enough for the occasional rough road.",
      },
      {
        id: "hiace",
        name: "Toyota Hiace Van",
        reason: "Perfect for groups of 6–12 travelling between Kampala, Entebbe, and Jinja. Spacious, reliable, and cost-effective for corporate or group travel.",
      },
    ],
    practicalInfo: [
      { label: "Entebbe Airport to Kampala", value: "40km — 45–90 min" },
      { label: "Kampala to Jinja", value: "85km — 1.5–2 hours" },
      { label: "Local Currency", value: "Ugandan Shilling (UGX)" },
      { label: "Visa", value: "EAC e-visa or on arrival" },
      { label: "Driving Side", value: "Left-hand side" },
      { label: "Ferry to Ssese Islands", value: "From Nakiwogo, Entebbe" },
    ],
    bestMonths: "December–February & June–August (drier seasons)",
    difficulty: "Easy — mostly urban and tarmac roads",
    ctaText: "Book a Kampala City Vehicle",
  },
  {
    slug: "zanzibar-road-trip",
    title: "Zanzibar & Tanzania Coast Road Trip",
    subtitle: "Dar es Salaam to Stone Town — The Indian Ocean Route",
    category: "Road Trip",
    country: "Tanzania",
    flag: "🇹🇿",
    readTime: "6 min read",
    coverGradient: "from-cyan-950 via-teal-900 to-cyan-800",
    accentColor: "text-cyan-400",
    tags: ["Zanzibar", "Dar es Salaam", "Stone Town", "Beach", "Ferry", "Road Trip"],
    intro:
      "Tanzania's coast is one of the Indian Ocean's great secrets — white sand beaches, spice islands, and Swahili architecture stretching from Dar es Salaam to the legendary island of Zanzibar. This road trip covers the coastal highlights from Dar es Salaam north to Bagamoyo and Pangani, with a ferry crossing to Zanzibar and an exploration of Stone Town before looping back. It's a journey of history, culture, and extraordinary natural beauty.",
    sections: [
      {
        heading: "Dar es Salaam — Starting Point",
        body:
          "Tanzania's largest city is often dismissed as a transit point, but it rewards a day's exploration. The Village Museum showcases 16 traditional Tanzanian homesteads with live craft demonstrations. The Kariakoo Market is one of East Africa's largest and most atmospheric. Slipway Shopping Centre on the Msasani Peninsula offers waterfront dining and crafts in a pleasant open-air setting. For a beach day before the road trip begins, Coco Beach (local and lively) or the quieter beaches of Kunduchi (30min north) are both excellent.",
        tip:
          "Dar es Salaam traffic rivals Kampala. Schedule any city driving before 7:30 AM or after 8:00 PM during weekdays, or plan to move slowly and embrace the pace.",
      },
      {
        heading: "The Coastal Road North — Bagamoyo",
        body:
          "Bagamoyo, 75km north of Dar, was once one of East Africa's most important trading towns — the terminus of ancient slave trade routes and the point where Stanley departed to find Livingstone. The old town is a UNESCO-listed atmospheric ruins site: coral rag architecture, an 1860s Catholic mission, Arab merchants' homes, and a small but moving slave trade memorial. The beach north of town is quiet and beautiful. Chuo Kikuu beach resort is excellent for a seafood lunch.",
      },
      {
        heading: "The Ferry to Zanzibar",
        body:
          "The Zanzibar ferry from Dar es Salaam to Stone Town takes approximately 2 hours and runs multiple times daily. Azam Marine and Coastal Fast Ferries are the main operators. Morning ferries (7–9 AM) are recommended for calmer seas and afternoon arrival with time to check in before sunset. Note: vehicles cannot be taken on the ferry — if you're taking your NOVACAR rental to the coast and heading to Zanzibar, park it securely in Dar and rent a scooter or tuk-tuk on the island.",
        tip:
          "Buy ferry tickets at least one day in advance, especially during Eid, Christmas, and August peak season. The ticket office is near the Kivukoni ferry terminal in central Dar.",
      },
      {
        heading: "Stone Town & Zanzibar Highlights",
        body:
          "Stone Town is a UNESCO World Heritage Site — a labyrinthine warren of narrow streets, carved wooden doors, mosques, and Arab-influenced mansions. The Old Fort, the House of Wonders, and the Slave Market Memorial are essential visits. Zanzibar's beaches are extraordinary: Nungwi (north, lively) and Paje (east, kite surfing) are the most popular. Jozani Forest protects the endemic Red Colobus monkey — a fascinating half-day trip from Stone Town. The spice tour in Zanzibar's central farmland is a must for food lovers.",
      },
    ],
    recommendedVehicles: [
      {
        id: "fortuner",
        name: "Toyota Fortuner",
        reason: "The ideal coastal road trip vehicle — comfortable on the Dar–Bagamoyo tarmac and capable on unpaved coastal tracks to hidden beaches.",
      },
      {
        id: "rav4",
        name: "Toyota RAV4",
        reason: "Compact, fuel-efficient and comfortable for two or four people on a coastal drive. Good clearance for the sandy tracks north of Bagamoyo.",
      },
      {
        id: "camry",
        name: "Toyota Camry",
        reason: "For travellers who want a smooth, air-conditioned motorway drive from Dar es Salaam to the ferry terminal without going off-road.",
      },
    ],
    practicalInfo: [
      { label: "Dar to Bagamoyo", value: "75km — 1.5–2 hours" },
      { label: "Ferry to Zanzibar", value: "2 hours (Azam Marine)" },
      { label: "Note on Vehicles", value: "Cars cannot board the ferry" },
      { label: "Zanzibar Visa", value: "Separate entry required for non-EAC" },
      { label: "Local Currency", value: "Tanzanian Shilling (TZS) + USD" },
      { label: "Best Beach Months", value: "June–October (dry, less humid)" },
    ],
    bestMonths: "June–October",
    difficulty: "Easy — mostly tarmac roads",
    ctaText: "Book Your Coastal Road Trip Vehicle",
  },
];

export function getGuideBySlug(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}

export const guideCategories = [...new Set(guides.map((g) => g.category))];
