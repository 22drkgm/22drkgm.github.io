/* PhD journey — single source of truth for the timeline used by every site version.
   Add new milestones at the end of the right semester (or add a new semester block).
   type: "workshop" | "conference" | "publication" | "international"
   Keep entries in chronological order. */
window.JOURNEY = {
  metrics: [
    { value: "2",   label: "Publications", note: "First author, Q1" },
    { value: "12",  label: "Workshops",    note: "& certifications" },
    { value: "3+1", label: "Conferences",  note: "incl. international oral" }
  ],
  semesters: [
    {
      label: "2023 – mid 2024",
      items: [
        { date: "Apr 2023", type: "workshop",
          title: "NASA ARSET — Fundamentals of Machine Learning for Earth Science",
          detail: "20, 27 April & 4 May 2023 · Remote" },
        { date: "Dec 2023", type: "conference",
          title: "IASTA 2023, Mumbai",
          detail: "Poster: Source profile of carbonaceous PM2.5 emissions from primary sources in Dhanbad" },
        { date: "Jan 2024", type: "publication",
          title: "Atmospheric Environment: X",
          detail: "Source profile of PM2.5 emissions from different primary sources in the coal capital city Dhanbad, India",
          authors: "Mishra, K.G., Prakashmani, Gupta, T., & Izhar, S.",
          doi: "10.1016/j.aeaoa.2024.100235" },
        { date: "Feb 2024", type: "workshop",
          title: "Aerosol Science Intensive Course",
          detail: "IIT Delhi & University of Helsinki, Sonipat · 5–15 February 2024" },
        { date: "May 2024", type: "workshop",
          title: "Indo–UK Workshop: Addressing Indoor Air Quality Challenges in Dhanbad",
          detail: "IIT (ISM) Dhanbad · 18 May 2024" }
      ]
    },
    {
      label: "Aug 2024 – Feb 2025",
      items: [
        { date: "Aug 2024", type: "workshop",
          title: "NASA ARSET — Atmospheric Composition Ground Networks",
          detail: "8, 13, 15, 20 & 22 August 2024 · Remote" },
        { date: "Sep 2024", type: "workshop",
          title: "National Training on Advanced Aerosol Instrumentation",
          detail: "IITM Pune & IASTA · 29 September – 4 October 2024" },
        { date: "Oct 2024", type: "workshop",
          title: "Advanced Drone Technology (Air Taxi)",
          detail: "India Space Lab & India Space Week · 27 October 2024 · Remote" },
        { date: "Dec 2024", type: "workshop",
          title: "CAPHER–IASTA: Writing Successful Research Proposals for Air Pollution and Health",
          detail: "Doon University · 16 December 2024" },
        { date: "Dec 2024", type: "conference",
          title: "IASTA 2024, Dehradun",
          detail: "Poster: Optical and isotopic source profile in size-segregated traffic and combustion sources" },
        { date: "Feb 2025", type: "workshop",
          title: "EDP: Integrated Low-Cost Sensors & Automation Technologies for AQ Monitoring and Control in Mining Industry",
          detail: "IIT (ISM) Dhanbad" }
      ]
    },
    {
      label: "Jun 2025 – Oct 2025",
      items: [
        { date: "Jun 2025", type: "workshop",
          title: "5th IPSL Summer School: Atmospheric Chemistry and Air Quality",
          detail: "Sorbonne University, Paris · 30 June – 4 July 2025 · Remote" },
        { date: "Aug 2025", type: "workshop",
          title: "CAPHER & AIIMS Guwahati: Designing and Implementing Air Pollution and Health Research Studies",
          detail: "6–8 August 2025" },
        { date: "Aug 2025", type: "conference",
          title: "ICAS–CSTEP 2025, Bangalore",
          detail: "Poster + REACH reduced-complexity model hands-on training · Workshop 20 Aug, Conference 21–22 Aug" },
        { date: "Oct 2025", type: "publication",
          title: "Environmental Pollution",
          detail: "Insights on optical absorption and isotopic properties of carbonaceous aerosol in PM2.5 and PM10 from different emission sources",
          authors: "Mishra, K.G., Izhar, S., Paul, D., Qadri, A.M., & Gupta, T.",
          doi: "10.1016/j.envpol.2025.126558" }
      ]
    },
    {
      label: "Winter Semester 2025–26",
      items: [
        { date: "Jan 2026", type: "workshop",
          title: "Fundamentals of Aerosol Science (FAS)",
          detail: "The Aerosol Society, UK" },
        { date: "Feb 2026", type: "workshop",
          title: "Air Quality Monitoring and Data Analysis (AQMDA)",
          detail: "International Workshop · IIT (ISM) Dhanbad" },
        { date: "Mar 2026", type: "international", highlight: true,
          title: "iCACGP–IGAC 2026 — Oral Presentation Accepted",
          detail: "Heraklion, Crete, Greece · 6–11 September 2026" },
        { date: "2026", type: "international",
          title: "12th International Aerosol Conference (IAC 2026), Xi'an, China",
          detail: "Oral presentation accepted" },
        { date: "2026", type: "conference",
          title: "IASTA 2026",
          detail: "National aerosol conference" },
        { date: "Oct 2026", type: "conference",
          title: "International Conference on Emerging Environmental Challenges Jeopardizing Public Health: Policy Interventions for Resilient Societies",
          detail: "28–30 October 2026" }
      ]
    }
  ]
};
