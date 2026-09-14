import { createContext, useContext, useState } from "react";

export type Language = "en" | "fr" | "sw";

export const translations = {
  en: {
    // Nav
    nav_home: "Home",
    nav_fleet: "Fleet",
    nav_services: "Services",
    nav_destinations: "Destinations",
    nav_blogs: "Blog",
    nav_about: "About",
    nav_contact: "Contact",
    nav_book: "Book Now",

    // Home hero
    hero_badge: "Rwanda • Uganda • Tanzania",
    hero_headline_1: "The Drive of a",
    hero_headline_2: "Lifetime.",
    hero_sub: "East Africa's most trusted car rental — from executive airport transfers to deep-safari 4x4 expeditions across three countries.",
    hero_cta_book: "Book Your Vehicle",
    hero_cta_fleet: "Explore Fleet",

    // Stats
    stat_travelers: "Happy Travelers",
    stat_vehicles: "Vehicles in Fleet",
    stat_support: "Support",
    stat_countries: "Countries",

    // Services section
    services_label: "What We Offer",
    services_headline: "A Service for Every Journey.",

    // Why us
    why_label: "Why Choose Us",
    why_headline: "The NOVACAR Standard.",
    why_sub: "We don't just rent cars. We deliver the confidence that your vehicle will perform on every road — from Kigali's smooth boulevards to Bwindi's red dirt tracks.",
    why_story: "Our Story",

    // Fleet
    fleet_label: "Our Fleet",
    fleet_headline: "Built for Every Terrain.",
    fleet_cta: "View All Vehicles",
    fleet_reserve: "Reserve Now",
    fleet_from: "From",
    fleet_day: "/day",
    fleet_negotiable: "Negotiable Price",
    fleet_negotiable_short: "Negotiable",
    fleet_price_label: "Price",
    fleet_quote_hint: "Enquire for a tailored quote",

    // Destinations
    dest_label: "Destinations",
    dest_headline: "One Region. Endless Possibilities.",
    dest_sub: "From the pristine boulevards of Kigali and the thundering Murchison Falls to the endless Serengeti plains — our fleet covers every corner of East Africa.",
    dest_cta: "Explore Destinations",

    // Calculator
    calc_title: "Rental Cost Estimator",
    calc_sub: "Instant pricing — no obligation",
    calc_vehicle: "Vehicle Type",
    calc_pickup: "Pick-up Location",
    calc_from: "Pick-up Date",
    calc_to: "Return Date",
    calc_driver: "Add Professional Driver",
    calc_driver_sub: "+$30/day — multilingual, experienced",
    calc_select_dates: "Select dates to see your estimate",
    calc_subtotal: "Vehicle subtotal",
    calc_driver_fee: "Driver fee",
    calc_discount: "Long-stay discount",
    calc_total: "Estimated Total",
    calc_note: "Estimate only. Final price confirmed at booking.",
    calc_book: "Book This Vehicle",
    calc_select_placeholder: "Select location...",

    // Promise strip
    promise_headline: "Ready to Drive East Africa?",
    promise_sub: "Transparent pricing. No hidden fees. Confirmation in 2 hours.",
    promise_book: "Book Now",
    promise_fleet: "See Fleet",

    // Fleet page
    fleet_page_label: "Our Fleet",
    fleet_page_headline: "The Right Vehicle for Every Journey.",
    fleet_page_sub: "From rugged 4x4 safari vehicles to executive sedans and group transport, every vehicle in our fleet is professionally maintained, fully insured, and ready for East Africa's roads.",
    fleet_request: "Request Vehicle",
    fleet_seats: "seats",
    fleet_cta_headline: "Need a Custom Fleet Solution?",
    fleet_cta_sub: "Corporate clients, NGOs, and government institutions can access long-term leasing and tailored fleet packages.",
    fleet_cta_btn: "Contact Our Team",

    // Availability
    avail_label: "Live Availability",
    avail_headline: "Check Vehicle Availability",
    avail_sub: "Select your travel dates to instantly see which vehicles are available. Busy dates are highlighted on the calendar.",
    avail_select: "Select Date Range",
    avail_busy: "Busy dates",
    avail_your: "Your selection",
    avail_available: "Available",
    avail_booked: "Booked",
    avail_period: "Selected Period",
    avail_clear: "Clear selection",
    avail_hint: "Click a start date, then an end date to check availability",
    avail_conflict: "Conflicting bookings in your period:",
    avail_cta_headline: "vehicles available for your dates",
    avail_cta_sub: "Inquiry confirmed within 2 hours. No payment until booking is finalised.",
    avail_request: "Request Booking",
    avail_book: "Book",
    avail_select_dates: "Select dates",

    // Services page
    svc_label: "Our Services",
    svc_headline: "Every Journey, Fully Covered.",
    svc_sub: "Whether you need a quick city transfer, a weeklong safari expedition, or a long-term corporate fleet — we have a service tailored to your exact needs.",
    svc_included: "What's Included",
    svc_not_sure_headline: "Not Sure Which Service You Need?",
    svc_not_sure_sub: "Our team will help you find the right vehicle and service for your journey. No obligation — just expert advice.",
    svc_talk: "Talk to Our Team",
    svc_perfect_label: "Perfect For",
    svc_perfect_headline: "Who We Serve",

    // Destinations page
    dest_page_label: "Destinations",
    dest_page_headline: "One Fleet. Three Countries.",
    dest_page_sub: "NOVACAR RENTALS operates across Rwanda, Uganda, and Tanzania — giving you the freedom to cross borders, follow the migration, climb the volcano, or simply explore at your own pace.",
    dest_cities: "Cities We Serve",
    dest_parks: "Parks & Natural Wonders",
    dest_airport_label: "Airport Coverage",
    dest_airport_headline: "We Cover Every Major Airport",
    dest_airport_sub: "Our drivers monitor your flight in real time. We'll be there, whether you land on schedule or not.",
    dest_cross_label: "Cross-Border Travel",
    dest_cross_headline: "Seamless Border Crossings",
    dest_cross_sub: "All required documentation, cross-border permits, and insurance are handled by our team. You focus on the journey — we handle the paperwork.",
    dest_cross_cta: "Plan Your Multi-Country Trip",

    // About page
    about_label: "About NOVACAR",
    about_headline_1: "Built on Trust.",
    about_headline_2: "Driven by Passion.",
    about_sub: "NOVACAR RENTALS was founded on a simple belief: that travelers in East Africa deserve a rental experience as professional and reliable as anywhere else in the world.",
    about_story_label: "Our Story",
    about_values_label: "Our Values",
    about_values_headline: "What We Stand For",
    about_promise_label: "Our Promise",
    about_promise_headline: "The NOVACAR Commitment",
    about_testimonials: "What Clients Say",
    about_cta_headline: "Ready to Experience NOVACAR?",
    about_cta_sub: "Book your vehicle today and discover why thousands of travelers, businesses, and organizations trust us across East Africa.",
    about_book: "Book a Vehicle",
    about_fleet: "View Fleet",

    // Contact page
    contact_label: "Book a Vehicle",
    contact_headline_1: "Let's Get You",
    contact_headline_2: "on the Road.",
    contact_sub: "Fill out the form below and our team will confirm your booking within 2 hours. No commitment — just a quick, easy inquiry.",
    contact_form_title: "Booking Inquiry",
    contact_name: "Full Name",
    contact_email: "Email Address",
    contact_phone: "Phone / WhatsApp",
    contact_pickup_loc: "Pick-up Location",
    contact_dropoff_loc: "Drop-off Location",
    contact_pickup_date: "Pick-up Date",
    contact_return_date: "Return Date",
    contact_vehicle: "Vehicle Type",
    contact_notes: "Additional Notes",
    contact_submit: "Send Booking Inquiry",
    contact_submitting: "Sending Inquiry...",
    contact_no_payment: "No payment required. Our team will contact you to confirm details and pricing.",
    contact_details_title: "Contact Details",
    contact_details_sub: "Prefer to talk directly? Reach us via phone, WhatsApp, or email. We're available 24/7 for urgent requests.",
    contact_whatsapp_title: "Chat on WhatsApp",
    contact_whatsapp_sub: "For fastest response, message us directly on WhatsApp. Most inquiries answered within 15 minutes.",
    contact_whatsapp_btn: "Open WhatsApp Chat",
    contact_guarantee_title: "Our Booking Guarantee",

    // Footer
    footer_tagline: "East Africa's trusted car rental partner. Professional, reliable, and built for adventure.",
    footer_links: "Quick Links",
    footer_services: "Our Services",
    footer_contact: "Contact Us",
    footer_rights: "All rights reserved.",
    footer_privacy: "Privacy Policy",
    footer_terms: "Terms of Service",
    footer_rental: "Rental Agreement",

    // WhatsApp widget
    wa_greeting: "Hi there! Ready to hit the road across East Africa?",
    wa_generic: "I'd like to rent a vehicle. Can you help?",
    wa_sending: "Sending…",
    wa_hint: "Select a vehicle on the Fleet page to pre-fill your enquiry automatically.",
    wa_open: "Open in WhatsApp",
    wa_send: "Send Booking Enquiry",
    wa_reply: "Typically replies in 15 minutes",
    wa_message: (vehicle: string, from: string, to: string) =>
      `Hello NOVACAR! I'd like to book a *${vehicle}* from *${from}* to *${to}*. Please confirm availability and send me a quote.`,
    wa_generic_message: "Hello NOVACAR! I'd like to enquire about renting a vehicle. Could you help me?",
  },

  fr: {
    nav_home: "Accueil",
    nav_fleet: "Flotte",
    nav_services: "Services",
    nav_destinations: "Destinations",
    nav_blogs: "Blog",
    nav_about: "À propos",
    nav_contact: "Contact",
    nav_book: "Réserver",

    hero_badge: "Rwanda • Ouganda • Tanzanie",
    hero_headline_1: "Le Voyage d'une",
    hero_headline_2: "Vie.",
    hero_sub: "Le loueur de voitures le plus fiable d'Afrique de l'Est — des transferts aéroport en berline executive aux expéditions 4x4 en safari sur trois pays.",
    hero_cta_book: "Réserver un Véhicule",
    hero_cta_fleet: "Explorer la Flotte",

    stat_travelers: "Voyageurs Satisfaits",
    stat_vehicles: "Véhicules en Flotte",
    stat_support: "Assistance",
    stat_countries: "Pays",

    services_label: "Nos Offres",
    services_headline: "Un Service pour Chaque Voyage.",

    why_label: "Pourquoi Nous Choisir",
    why_headline: "Le Standard NOVACAR.",
    why_sub: "Nous ne louons pas seulement des voitures. Nous vous offrons la certitude que votre véhicule performera sur chaque route.",
    why_story: "Notre Histoire",

    fleet_label: "Notre Flotte",
    fleet_headline: "Conçue pour Chaque Terrain.",
    fleet_cta: "Voir Tous les Véhicules",
    fleet_reserve: "Réserver",
    fleet_from: "À partir de",
    fleet_day: "/jour",
    fleet_negotiable: "Prix négociable",
    fleet_negotiable_short: "Négociable",
    fleet_price_label: "Prix",
    fleet_quote_hint: "Demandez un devis sur mesure",

    dest_label: "Destinations",
    dest_headline: "Une Région. Des Possibilités Infinies.",
    dest_sub: "Des boulevards de Kigali aux plaines du Serengeti — notre flotte couvre chaque coin d'Afrique de l'Est.",
    dest_cta: "Explorer les Destinations",

    calc_title: "Estimateur de Coût",
    calc_sub: "Tarif instantané — sans engagement",
    calc_vehicle: "Type de Véhicule",
    calc_pickup: "Lieu de Prise en Charge",
    calc_from: "Date de Départ",
    calc_to: "Date de Retour",
    calc_driver: "Ajouter un Chauffeur Professionnel",
    calc_driver_sub: "+30$/jour — multilingue, expérimenté",
    calc_select_dates: "Sélectionnez des dates pour voir l'estimation",
    calc_subtotal: "Sous-total véhicule",
    calc_driver_fee: "Frais chauffeur",
    calc_discount: "Remise longue durée",
    calc_total: "Total Estimé",
    calc_note: "Estimation uniquement. Prix final confirmé à la réservation.",
    calc_book: "Réserver ce Véhicule",
    calc_select_placeholder: "Sélectionner un lieu...",

    promise_headline: "Prêt à Parcourir l'Afrique de l'Est ?",
    promise_sub: "Tarifs transparents. Sans frais cachés. Confirmation en 2 heures.",
    promise_book: "Réserver",
    promise_fleet: "Voir la Flotte",

    fleet_page_label: "Notre Flotte",
    fleet_page_headline: "Le Bon Véhicule pour Chaque Voyage.",
    fleet_page_sub: "Des 4x4 robustes aux berlines executive, chaque véhicule est entretenu, assuré et prêt pour les routes d'Afrique de l'Est.",
    fleet_request: "Demander ce Véhicule",
    fleet_seats: "places",
    fleet_cta_headline: "Besoin d'une Solution Flotte Personnalisée ?",
    fleet_cta_sub: "Les entreprises, ONG et institutions gouvernementales peuvent accéder à des packages de location longue durée.",
    fleet_cta_btn: "Contacter Notre Équipe",

    avail_label: "Disponibilité en Temps Réel",
    avail_headline: "Vérifier la Disponibilité",
    avail_sub: "Sélectionnez vos dates de voyage pour voir instantanément quels véhicules sont disponibles.",
    avail_select: "Sélectionner une Période",
    avail_busy: "Dates occupées",
    avail_your: "Votre sélection",
    avail_available: "Disponible",
    avail_booked: "Réservé",
    avail_period: "Période Sélectionnée",
    avail_clear: "Effacer la sélection",
    avail_hint: "Cliquez sur une date de début, puis une date de fin",
    avail_conflict: "Réservations en conflit sur votre période :",
    avail_cta_headline: "véhicules disponibles pour vos dates",
    avail_cta_sub: "Demande confirmée sous 2 heures. Aucun paiement jusqu'à la finalisation.",
    avail_request: "Demander une Réservation",
    avail_book: "Réserver",
    avail_select_dates: "Choisir des dates",

    svc_label: "Nos Services",
    svc_headline: "Chaque Voyage, Entièrement Couvert.",
    svc_sub: "Transfert rapide en ville, expédition safari d'une semaine ou flotte d'entreprise longue durée — nous avons le service adapté.",
    svc_included: "Ce qui est Inclus",
    svc_not_sure_headline: "Pas Sûr du Service ?",
    svc_not_sure_sub: "Notre équipe vous aidera à trouver le bon véhicule. Sans engagement — juste des conseils d'experts.",
    svc_talk: "Parler à Notre Équipe",
    svc_perfect_label: "Parfait Pour",
    svc_perfect_headline: "Qui Nous Servons",

    dest_page_label: "Destinations",
    dest_page_headline: "Une Flotte. Trois Pays.",
    dest_page_sub: "NOVACAR RENTALS opère au Rwanda, en Ouganda et en Tanzanie — pour traverser les frontières, suivre la migration ou explorer à votre rythme.",
    dest_cities: "Villes Desservies",
    dest_parks: "Parcs & Merveilles Naturelles",
    dest_airport_label: "Couverture Aéroports",
    dest_airport_headline: "Nous Couvrons Tous les Grands Aéroports",
    dest_airport_sub: "Nos chauffeurs suivent votre vol en temps réel. Nous serons là, quelle que soit votre heure d'arrivée.",
    dest_cross_label: "Voyage Transfrontalier",
    dest_cross_headline: "Franchissement de Frontières sans Problème",
    dest_cross_sub: "Tous les documents, permis transfrontaliers et assurances sont gérés par notre équipe.",
    dest_cross_cta: "Planifier votre Voyage Multi-Pays",

    about_label: "À Propos de NOVACAR",
    about_headline_1: "Fondé sur la Confiance.",
    about_headline_2: "Guidé par la Passion.",
    about_sub: "NOVACAR RENTALS a été fondé sur une conviction simple : les voyageurs en Afrique de l'Est méritent une expérience de location aussi professionnelle que partout ailleurs.",
    about_story_label: "Notre Histoire",
    about_values_label: "Nos Valeurs",
    about_values_headline: "Ce pour Quoi Nous nous Battons",
    about_promise_label: "Notre Promesse",
    about_promise_headline: "L'Engagement NOVACAR",
    about_testimonials: "Ce que Disent nos Clients",
    about_cta_headline: "Prêt à Découvrir NOVACAR ?",
    about_cta_sub: "Réservez votre véhicule dès aujourd'hui et découvrez pourquoi des milliers de voyageurs nous font confiance.",
    about_book: "Réserver un Véhicule",
    about_fleet: "Voir la Flotte",

    contact_label: "Réserver un Véhicule",
    contact_headline_1: "Mettons-vous",
    contact_headline_2: "sur la Route.",
    contact_sub: "Remplissez le formulaire et notre équipe confirmera votre réservation dans les 2 heures.",
    contact_form_title: "Demande de Réservation",
    contact_name: "Nom Complet",
    contact_email: "Adresse E-mail",
    contact_phone: "Téléphone / WhatsApp",
    contact_pickup_loc: "Lieu de Prise en Charge",
    contact_dropoff_loc: "Lieu de Retour",
    contact_pickup_date: "Date de Départ",
    contact_return_date: "Date de Retour",
    contact_vehicle: "Type de Véhicule",
    contact_notes: "Notes Supplémentaires",
    contact_submit: "Envoyer la Demande",
    contact_submitting: "Envoi en cours...",
    contact_no_payment: "Aucun paiement requis. Notre équipe vous contactera pour confirmer les détails.",
    contact_details_title: "Coordonnées",
    contact_details_sub: "Préférez parler directement ? Contactez-nous par téléphone, WhatsApp ou e-mail.",
    contact_whatsapp_title: "Chat WhatsApp",
    contact_whatsapp_sub: "Pour la réponse la plus rapide, écrivez-nous directement sur WhatsApp. La plupart des demandes sont répondues en 15 minutes.",
    contact_whatsapp_btn: "Ouvrir WhatsApp",
    contact_guarantee_title: "Notre Garantie de Réservation",

    footer_tagline: "Votre partenaire de location de voitures en Afrique de l'Est. Professionnel, fiable et conçu pour l'aventure.",
    footer_links: "Liens Rapides",
    footer_services: "Nos Services",
    footer_contact: "Contactez-Nous",
    footer_rights: "Tous droits réservés.",
    footer_privacy: "Politique de Confidentialité",
    footer_terms: "Conditions d'Utilisation",
    footer_rental: "Contrat de Location",

    wa_greeting: "Bonjour ! Prêt à parcourir l'Afrique de l'Est ?",
    wa_generic: "Je souhaite louer un véhicule. Pouvez-vous m'aider ?",
    wa_sending: "Envoi…",
    wa_hint: "Sélectionnez un véhicule sur la page Flotte pour pré-remplir votre demande.",
    wa_open: "Ouvrir WhatsApp",
    wa_send: "Envoyer la Demande",
    wa_reply: "Répond généralement en 15 minutes",
    wa_message: (vehicle: string, from: string, to: string) =>
      `Bonjour NOVACAR ! Je souhaite réserver un *${vehicle}* du *${from}* au *${to}*. Merci de confirmer la disponibilité et de m'envoyer un devis.`,
    wa_generic_message: "Bonjour NOVACAR ! Je souhaite louer un véhicule. Pouvez-vous m'aider ?",
  },

  sw: {
    nav_home: "Nyumbani",
    nav_fleet: "Magari",
    nav_services: "Huduma",
    nav_destinations: "Maeneo",
    nav_blogs: "Blogu",
    nav_about: "Kuhusu",
    nav_contact: "Wasiliana",
    nav_book: "Panga Safari",

    hero_badge: "Rwanda • Uganda • Tanzania",
    hero_headline_1: "Safari ya",
    hero_headline_2: "Maisha.",
    hero_sub: "Kampuni ya kukodisha gari inayoaminika zaidi Afrika Mashariki — kutoka usafiri wa uwanja wa ndege hadi safari za 4x4 katika mataifa matatu.",
    hero_cta_book: "Panga Gari Lako",
    hero_cta_fleet: "Angalia Magari",

    stat_travelers: "Wasafiri Waliofurahi",
    stat_vehicles: "Magari ya Kukodisha",
    stat_support: "Msaada",
    stat_countries: "Nchi",

    services_label: "Tunachotoa",
    services_headline: "Huduma kwa Kila Safari.",

    why_label: "Kwa Nini Sisi",
    why_headline: "Kiwango cha NOVACAR.",
    why_sub: "Hatukodishi magari tu. Tunatoa uhakika kwamba gari lako litafanya kazi vizuri kwenye kila barabara.",
    why_story: "Hadithi Yetu",

    fleet_label: "Magari Yetu",
    fleet_headline: "Imejengwa kwa Kila Ardhi.",
    fleet_cta: "Angalia Magari Yote",
    fleet_reserve: "Hifadhi Sasa",
    fleet_from: "Kuanzia",
    fleet_day: "/siku",
    fleet_negotiable: "Bei inayojadiliwa",
    fleet_negotiable_short: "Inajadiliwa",
    fleet_price_label: "Bei",
    fleet_quote_hint: "Wasiliana kwa bei maalum",

    dest_label: "Maeneo",
    dest_headline: "Mkoa Mmoja. Uwezekano Usio na Mwisho.",
    dest_sub: "Kutoka mitaa ya Kigali hadi tambarare za Serengeti — tunahudumia kila kona ya Afrika Mashariki.",
    dest_cta: "Gundua Maeneo",

    calc_title: "Kadiria Gharama",
    calc_sub: "Bei ya haraka — bila ahadi",
    calc_vehicle: "Aina ya Gari",
    calc_pickup: "Mahali pa Kuchukua",
    calc_from: "Tarehe ya Kuanza",
    calc_to: "Tarehe ya Kurudisha",
    calc_driver: "Ongeza Dereva wa Kitaalamu",
    calc_driver_sub: "+$30/siku — lugha nyingi, mwenye uzoefu",
    calc_select_dates: "Chagua tarehe kuona makadirio",
    calc_subtotal: "Jumla ya gari",
    calc_driver_fee: "Ada ya dereva",
    calc_discount: "Punguzo la muda mrefu",
    calc_total: "Jumla Iliyokadiriwa",
    calc_note: "Makadirio tu. Bei ya mwisho ithibitishwa wakati wa kuwasiliana.",
    calc_book: "Hifadhi Gari Hili",
    calc_select_placeholder: "Chagua mahali...",

    promise_headline: "Uko Tayari Kusafiri Afrika Mashariki?",
    promise_sub: "Bei wazi. Bila ada zilizofichwa. Uthibitisho ndani ya saa 2.",
    promise_book: "Panga Sasa",
    promise_fleet: "Angalia Magari",

    fleet_page_label: "Magari Yetu",
    fleet_page_headline: "Gari Sahihi kwa Kila Safari.",
    fleet_page_sub: "Kutoka 4x4 za safari hadi sedani za kibiashara, kila gari linatunzwa, limehakikishiwa bima, na liko tayari kwa barabara za Afrika Mashariki.",
    fleet_request: "Omba Gari Hili",
    fleet_seats: "viti",
    fleet_cta_headline: "Unahitaji Suluhisho la Kikosi cha Magari?",
    fleet_cta_sub: "Makampuni, NGO na taasisi za serikali wanaweza kupata kukodisha kwa muda mrefu.",
    fleet_cta_btn: "Wasiliana na Timu Yetu",

    avail_label: "Upatikanaji wa Sasa Hivi",
    avail_headline: "Angalia Upatikanaji wa Magari",
    avail_sub: "Chagua tarehe za safari yako kuona mara moja magari gani yanapatikana.",
    avail_select: "Chagua Kipindi cha Tarehe",
    avail_busy: "Tarehe zilizojaa",
    avail_your: "Uchaguzi wako",
    avail_available: "Inapatikana",
    avail_booked: "Imehifadhiwa",
    avail_period: "Kipindi Kilichochaguliwa",
    avail_clear: "Futa uchaguzi",
    avail_hint: "Bonyeza tarehe ya kuanza, kisha tarehe ya mwisho",
    avail_conflict: "Mihifadhi inayogongana katika kipindi chako:",
    avail_cta_headline: "magari yanapatikana kwa tarehe zako",
    avail_cta_sub: "Ombi linathibitishwa ndani ya saa 2. Hakuna malipo mpaka uhifadhi uwe kamili.",
    avail_request: "Omba Uhifadhi",
    avail_book: "Hifadhi",
    avail_select_dates: "Chagua tarehe",

    svc_label: "Huduma Zetu",
    svc_headline: "Kila Safari, Imefunikwa Kikamilifu.",
    svc_sub: "Iwe unahitaji usafiri wa haraka mjini, safari ya wiki nzima, au kikosi cha kampuni — tuna huduma inayokufaa.",
    svc_included: "Kilichojumuishwa",
    svc_not_sure_headline: "Hujui Huduma Unayohitaji?",
    svc_not_sure_sub: "Timu yetu itakusaidia kupata gari na huduma sahihi. Bila ahadi — ushauri wa wataalamu tu.",
    svc_talk: "Zungumza na Timu Yetu",
    svc_perfect_label: "Inafaa Kwa",
    svc_perfect_headline: "Tunaowatumiia",

    dest_page_label: "Maeneo",
    dest_page_headline: "Kikosi Kimoja. Nchi Tatu.",
    dest_page_sub: "NOVACAR RENTALS inafanya kazi Rwanda, Uganda na Tanzania — kukupa uhuru wa kuvuka mipaka, kufuata uhamiaji, au kuchunguza kwa kasi yako.",
    dest_cities: "Miji Tunayohudumia",
    dest_parks: "Mbuga & Maajabu ya Asili",
    dest_airport_label: "Huduma za Uwanja wa Ndege",
    dest_airport_headline: "Tunafunika Kila Uwanja Mkuu wa Ndege",
    dest_airport_sub: "Madereva wetu wanafuatilia ndege yako wakati halisi. Tutakuwepo, iwe unafika kwa wakati au la.",
    dest_cross_label: "Usafiri wa Kuvuka Mipaka",
    dest_cross_headline: "Kuvuka Mipaka bila Wasiwasi",
    dest_cross_sub: "Nyaraka zote zinazohitajika, vibali vya kuvuka mipaka na bima zote zinasimamiwa na timu yetu.",
    dest_cross_cta: "Panga Safari ya Nchi Nyingi",

    about_label: "Kuhusu NOVACAR",
    about_headline_1: "Imejengwa kwa Uaminifu.",
    about_headline_2: "Inayoongozwa na Shauku.",
    about_sub: "NOVACAR RENTALS ilianzishwa kwa imani moja: wasafiri Afrika Mashariki wanastahili uzoefu wa kukodisha gari ulio wa kitaalamu kama mahali popote duniani.",
    about_story_label: "Hadithi Yetu",
    about_values_label: "Maadili Yetu",
    about_values_headline: "Tunachosimama Nacho",
    about_promise_label: "Ahadi Yetu",
    about_promise_headline: "Commitment ya NOVACAR",
    about_testimonials: "Wanachosema Wateja Wetu",
    about_cta_headline: "Uko Tayari Kujaribu NOVACAR?",
    about_cta_sub: "Hifadhi gari lako leo na ugundua kwa nini wasafiri, biashara na mashirika elfu wanaamini katika huduma zetu.",
    about_book: "Hifadhi Gari",
    about_fleet: "Angalia Magari",

    contact_label: "Hifadhi Gari",
    contact_headline_1: "Tukuweke",
    contact_headline_2: "Barabarani.",
    contact_sub: "Jaza fomu hapa chini na timu yetu itathibitisha uhifadhi wako ndani ya saa 2.",
    contact_form_title: "Ombi la Uhifadhi",
    contact_name: "Jina Kamili",
    contact_email: "Anwani ya Barua Pepe",
    contact_phone: "Simu / WhatsApp",
    contact_pickup_loc: "Mahali pa Kuchukua",
    contact_dropoff_loc: "Mahali pa Kurudisha",
    contact_pickup_date: "Tarehe ya Kuchukua",
    contact_return_date: "Tarehe ya Kurudisha",
    contact_vehicle: "Aina ya Gari",
    contact_notes: "Maelezo ya Ziada",
    contact_submit: "Tuma Ombi la Uhifadhi",
    contact_submitting: "Inatuma...",
    contact_no_payment: "Hakuna malipo yanayohitajika. Timu yetu itawasiliana nawe kuthibitisha maelezo.",
    contact_details_title: "Mawasiliano",
    contact_details_sub: "Unapendelea kuzungumza moja kwa moja? Wasiliana nasi kupitia simu, WhatsApp au barua pepe.",
    contact_whatsapp_title: "Gumza kwenye WhatsApp",
    contact_whatsapp_sub: "Kwa majibu ya haraka zaidi, tuandikie moja kwa moja kwenye WhatsApp. Maswali mengi yanajibiwa ndani ya dakika 15.",
    contact_whatsapp_btn: "Fungua WhatsApp",
    contact_guarantee_title: "Dhamana ya Uhifadhi Wetu",

    footer_tagline: "Mshirika wako wa kukodisha gari Afrika Mashariki. Wa kitaalamu, wa kuaminika na uliojengwa kwa matukio ya kusisimua.",
    footer_links: "Viungo vya Haraka",
    footer_services: "Huduma Zetu",
    footer_contact: "Wasiliana Nasi",
    footer_rights: "Haki zote zimehifadhiwa.",
    footer_privacy: "Sera ya Faragha",
    footer_terms: "Masharti ya Huduma",
    footer_rental: "Mkataba wa Kukodisha",

    wa_greeting: "Habari! Uko tayari kusafiri Afrika Mashariki?",
    wa_generic: "Ningependa kukodisha gari. Je, mnaweza kunisaidia?",
    wa_sending: "Inatuma…",
    wa_hint: "Chagua gari kwenye ukurasa wa Magari ili kujaza ombi lako kiotomatiki.",
    wa_open: "Fungua WhatsApp",
    wa_send: "Tuma Ombi la Uhifadhi",
    wa_reply: "Kawaida hujibu ndani ya dakika 15",
    wa_message: (vehicle: string, from: string, to: string) =>
      `Habari NOVACAR! Ningependa kuhifadhi *${vehicle}* kuanzia *${from}* hadi *${to}*. Tafadhali thibitisha upatikanaji na unitumie bei.`,
    wa_generic_message: "Habari NOVACAR! Ningependa kukodisha gari. Je, mnaweza kunisaidia?",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key) => translations.en[key] as string,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem("novacar_lang");
      if (saved === "en" || saved === "fr" || saved === "sw") return saved;
    } catch {}
    return "en";
  });

  function persistLanguage(l: Language) {
    try { localStorage.setItem("novacar_lang", l); } catch {}
    setLanguage(l);
  }

  function t(key: TranslationKey): string {
    const val = (translations[language] as Record<string, unknown>)[key];
    if (typeof val === "string") return val;
    // fallback to English
    const en = (translations.en as Record<string, unknown>)[key];
    return typeof en === "string" ? en : String(key);
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: persistLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
