const fs = require('fs');
const path = require('path');

const POSITIVE_EVENTS = [
  {
    id: "POL-POS-01",
    name: "Bipartisan Infrastructure & Clean Grid Accord",
    polarity: "Positive",
    category: "Legislative & Infrastructure",
    impact_min: 75,
    impact_max: 95,
    impact_tier: "Transformative",
    summary: "A landmark multi-year infrastructure package passes with cross-party backing, funding high-speed rail, regional power grid interconnections, and water purification facilities.",
    economic_triggers: { gdp_growth_min: 1.0, fiscal_deficit_max: 6.5 },
    contributing_factors: [
      {
        factor_id: "POL-POS-01-CF1",
        factor_name: "Cross-Party Negotiating Bloc Formation",
        mechanism: "Moderate lawmakers form a 20-member coalition rejecting ideological purity to deliver localized highway, port, and grid appropriations.",
        sub_factors: [
          { sub_factor_id: "POL-POS-01-CF1-SF1", sub_factor_name: "Chamber of Commerce & Union Joint Endorsement", description: "Business federations and building trade unions unite to lobby resistant faction leaders." },
          { sub_factor_id: "POL-POS-01-CF1-SF2", sub_factor_name: "Formula-Based State & Provincial Block Grants", description: "Statutory allocation algorithms ensure both urban hubs and rural counties receive guaranteed funding quotas." }
        ]
      },
      {
        factor_id: "POL-POS-01-CF2",
        factor_name: "Private-Capital Matching Infrastructure Bank",
        mechanism: "Novel sovereign loan guarantee mechanism leverages private institutional pension funds to match federal funding 3-to-1.",
        sub_factors: [
          { sub_factor_id: "POL-POS-01-CF2-SF1", sub_factor_name: "Tax-Exempt Municipal Green Bond Expansion", description: "Creates low-cost municipal borrowing windows backed by future toll and utility tariff revenues." }
        ]
      }
    ],
    choices: [
      {
        option_id: "A",
        label: "Take Chief Authorship & Direct Funds to Your District",
        description: "Aggressively champion the bill, securing high-visibility bridges and rail upgrades for your constituents.",
        political_effects: { district_approval: 8, national_approval: 5, party_loyalty: 3, war_chest: 2.5, political_capital: 10 },
        economic_effects: { gdp_growth: 0.35, unemployment_rate: -0.25, fiscal_deficit: 0.40 }
      },
      {
        option_id: "B",
        label: "Demand Stricter Deficit Offsets & Spending Caps",
        description: "Position yourself as a fiscal guardian by requiring unspent pandemic funds and subsidy clawbacks to pay for it.",
        political_effects: { district_approval: 3, national_approval: 7, party_loyalty: -4, war_chest: 4.0, political_capital: 5 },
        economic_effects: { gdp_growth: 0.15, unemployment_rate: -0.10, fiscal_deficit: -0.20, inflation_cpi: -0.15 }
      },
      {
        option_id: "C",
        label: "Broker Labor & Environmental Standards Compromise",
        description: "Lead the coalition compromise ensuring prevailing union wages while expediting environmental permits by 24 months.",
        political_effects: { district_approval: 5, national_approval: 8, party_loyalty: 8, war_chest: 1.5, political_capital: 15 },
        economic_effects: { gdp_growth: 0.30, unemployment_rate: -0.20, fiscal_deficit: 0.20 }
      }
    ]
  },
  {
    id: "POL-POS-02",
    name: "National AI Administrative Efficiency Dividend",
    polarity: "Positive",
    category: "Technology & Productivity",
    impact_min: 70,
    impact_max: 90,
    impact_tier: "Major",
    summary: "Deployment of autonomous bureaucratic workflow agents across national agencies reduces passport backlogs, speeds tax auditing, and collapses procurement overhead.",
    economic_triggers: { gdp_growth_min: 1.2 },
    contributing_factors: [
      {
        factor_id: "POL-POS-02-CF1",
        factor_name: "Automated Regulatory Review & Permit Automation",
        mechanism: "Environmental and commercial zoning approvals are processed in 14 days rather than 18 months via AI compliance verification.",
        sub_factors: [
          { sub_factor_id: "POL-POS-02-CF1-SF1", sub_factor_name: "Open Architectural Data Standards", description: "Government datasets standardized for safe model ingestion and auditable citizen service." }
        ]
      }
    ],
    choices: [
      {
        option_id: "A",
        label: "Return Savings Directly via Tax Rebates",
        description: "Send every taxpayer a $500 'Digital Efficiency Dividend' check ahead of the election.",
        political_effects: { district_approval: 9, national_approval: 8, party_loyalty: 4, war_chest: 1.0, political_capital: -5 },
        economic_effects: { consumer_confidence: 6, inflation_cpi: 0.10, fiscal_deficit: 0.20 }
      },
      {
        option_id: "B",
        label: "Direct Fiscal Surplus Toward National Debt Reduction",
        description: "Apply $40B in operational bureaucratic savings directly into retiring sovereign short-term debt.",
        political_effects: { district_approval: 2, national_approval: 6, party_loyalty: 6, war_chest: 3.5, political_capital: 10 },
        economic_effects: { debt_to_gdp: -1.2, bond_yield_10y: -0.15, inflation_cpi: -0.20 }
      },
      {
        option_id: "C",
        label: "Establish Sovereign AI Worker Re-training Endowments",
        description: "Fund community colleges and trade unions to train displaced administrative staff in advanced technical trades.",
        political_effects: { district_approval: 6, national_approval: 7, party_loyalty: 7, war_chest: 2.0, political_capital: 8 },
        economic_effects: { unemployment_rate: -0.20, real_wage_growth: 0.25 }
      }
    ]
  },
  {
    id: "POL-POS-03",
    name: "Advanced Semiconductor Domestic Reshoring Surge",
    polarity: "Positive",
    category: "Industrial & National Security",
    impact_min: 65,
    impact_max: 85,
    impact_tier: "Major",
    summary: "Three leading multinational semiconductor fabrication mega-complexes break ground, bringing 45,000 high-wage manufacturing and engineering jobs.",
    economic_triggers: { interest_rate_max: 6.0 },
    contributing_factors: [
      {
        factor_id: "POL-POS-03-CF1",
        factor_name: "Targeted Capital Depreciation & Clean Power Guarantees",
        mechanism: "Federal industrial policy accords provide reliable geothermal/nuclear power contracts and accelerated depreciation for cleanroom CapEx."
      }
    ],
    choices: [
      {
        option_id: "A",
        label: "Lobby Heavily to Secure the Mega-Fab in Your State/District",
        description: "Offer tailored state zoning and university engineering partnerships to land the prime fabrication campus.",
        political_effects: { district_approval: 14, national_approval: 4, party_loyalty: 5, war_chest: 4.5, political_capital: 5 },
        economic_effects: { unemployment_rate: -0.30, gdp_growth: 0.25, housing_cost_index: 3.0 }
      },
      {
        option_id: "B",
        label: "Attach Strict Domestic Content & Profit-Sharing Mandates",
        description: "Ensure tech titans must reinvest 10% of windfall profits into local municipal school districts.",
        political_effects: { district_approval: 7, national_approval: 9, party_loyalty: 8, war_chest: -1.5, political_capital: 10 },
        economic_effects: { real_wage_growth: 0.30, gdp_growth: 0.15 }
      },
      {
        option_id: "C",
        label: "Ensure National Defense Critical Chip Allocation Quotas",
        description: "Mandate dedicated secure production lines for advanced avionics, radar, and naval microprocessors.",
        political_effects: { district_approval: 4, national_approval: 7, party_loyalty: 6, war_chest: 3.0, political_capital: 8 },
        economic_effects: { gdp_growth: 0.20, export_growth: 0.15 }
      }
    ]
  },
  {
    id: "POL-POS-04",
    name: "Sovereign Green Hydrogen & Clean Power Export Boom",
    polarity: "Positive",
    category: "Energy & Climate",
    impact_min: 70,
    impact_max: 92,
    impact_tier: "Transformative",
    summary: "Offshore wind installations and solar arrays reach generation surplus, allowing massive green hydrogen export contracts to allied industrial economies.",
    economic_triggers: { gdp_growth_min: 0.5 },
    choices: [
      {
        option_id: "A",
        label: "Channel Revenues into a Sovereign Clean Wealth Fund",
        description: "Create an endowment modeled after Nordic resource funds to pay lifetime education stipends.",
        political_effects: { district_approval: 6, national_approval: 10, party_loyalty: 6, war_chest: 2.0, political_capital: 12 },
        economic_effects: { gdp_growth: 0.30, debt_to_gdp: -0.80 }
      },
      {
        option_id: "B",
        label: "Subsidize Domestic Industrial Utility Rates",
        description: "Cut electricity costs for domestic manufacturers and steelmakers by 35% to beat foreign competitors.",
        political_effects: { district_approval: 8, national_approval: 7, party_loyalty: 7, war_chest: 4.0, political_capital: 8 },
        economic_effects: { unemployment_rate: -0.25, gdp_growth: 0.40, flexible_cpi: -0.30 }
      },
      {
        option_id: "C",
        label: "Slash Household Winter Heating & Power Tariffs",
        description: "Provide immediate monthly energy bill relief for working families across all districts.",
        political_effects: { district_approval: 11, national_approval: 8, party_loyalty: 5, war_chest: 1.0, political_capital: 6 },
        economic_effects: { consumer_confidence: 7, flexible_cpi: -0.45, poverty_discontent: -4.0 }
      }
    ]
  },
  {
    id: "POL-POS-05",
    name: "Historic Prescription Drug Price Cap Accord",
    polarity: "Positive",
    category: "Social & Healthcare",
    impact_min: 60,
    impact_max: 82,
    impact_tier: "Major",
    summary: "Landmark legislation caps out-of-pocket insulin and life-saving chronic medicine prices at $35/month, unlocking national public acclaim.",
    economic_triggers: { inflation_cpi_min: 2.0 },
    choices: [
      {
        option_id: "A",
        label: "Lead the Signature Signing Ceremony & Public Victory Tour",
        description: "Organize rallies across senior citizen centers spotlighting your role as chief champion.",
        political_effects: { district_approval: 10, national_approval: 9, party_loyalty: 6, war_chest: -2.0, political_capital: 14 },
        economic_effects: { consumer_confidence: 6, flexible_cpi: -0.20, real_wage_growth: 0.15 }
      },
      {
        option_id: "B",
        label: "Compromise with Pharma on Accelerated Clinical Trial Approvals",
        description: "Protect biotech R&D capital by pairing the price cap with streamlined FDA/EMA review lanes.",
        political_effects: { district_approval: 5, national_approval: 6, party_loyalty: 8, war_chest: 5.0, political_capital: 8 },
        economic_effects: { gdp_growth: 0.15, flexible_cpi: -0.10 }
      },
      {
        option_id: "C",
        label: "Expand Price Caps to All Generic Life-Saving Pediatric Medicines",
        description: "Double down and bring generic antibiotics and pediatric asthma inhalers under statutory price caps.",
        political_effects: { district_approval: 9, national_approval: 11, party_loyalty: 4, war_chest: -3.5, political_capital: 12 },
        economic_effects: { flexible_cpi: -0.25, consumer_confidence: 8 }
      }
    ]
  },
  {
    id: "POL-POS-06",
    name: "Comprehensive Childcare & Family Tax Credit Enactment",
    polarity: "Positive",
    category: "Welfare & Family",
    impact_min: 55,
    impact_max: 78,
    impact_tier: "Major",
    summary: "Expansion of refundable child tax credits and subsidized municipal daycares sparks female labor force participation surge.",
    economic_triggers: { unemployment_rate_max: 6.0 },
    choices: [
      {
        option_id: "A",
        label: "Claim Credit with Suburban Independent Swing Voters",
        description: "Deploy town hall campaign tour emphasizing middle-class affordability and family stability.",
        political_effects: { district_approval: 9, national_approval: 7, party_loyalty: 5, war_chest: 2.0, political_capital: 8 },
        economic_effects: { poverty_discontent: -6.0, unemployment_rate: -0.20, gdp_growth: 0.20 }
      },
      {
        option_id: "B",
        label: "Require Work & Training Certification Requirements",
        description: "Appease conservative factions by ensuring credit is tied strictly to active employment or apprenticeship enrollment.",
        political_effects: { district_approval: 5, national_approval: 6, party_loyalty: 9, war_chest: 3.5, political_capital: 6 },
        economic_effects: { fiscal_deficit: -0.15, unemployment_rate: -0.15 }
      },
      {
        option_id: "C",
        label: "Fund Directly via Luxury Capital Gains Surcharge",
        description: "Pay for the entire credit by closing carried-interest loopholes on mega-buyout private equity funds.",
        political_effects: { district_approval: 7, national_approval: 8, party_loyalty: 7, war_chest: -3.0, political_capital: 12 },
        economic_effects: { wealth_inequality_gini: -1.2, fiscal_deficit: -0.25 }
      }
    ]
  },
  {
    id: "POL-POS-07",
    name: "Allied Free Trade & Critical Mineral Supply Pact",
    polarity: "Positive",
    category: "Trade & Geopolitics",
    impact_min: 65,
    impact_max: 85,
    impact_tier: "Major",
    summary: "A multilateral trade treaty secures preferential lithium, rare-earth, and copper supplies while eliminating export tariffs with key allies.",
    economic_triggers: { currency_index_min: 92 },
    choices: [
      {
        option_id: "A",
        label: "Ratify Immediately & Secure Allied High-Tech Market Access",
        description: "Champion swift floor ratification to cement strategic semiconductor and EV alliances.",
        political_effects: { district_approval: 4, national_approval: 8, party_loyalty: 7, war_chest: 4.0, political_capital: 10 },
        economic_effects: { gdp_growth: 0.35, export_growth: 0.40, flexible_cpi: -0.20 }
      },
      {
        option_id: "B",
        label: "Carve Out Protectionist Exemptions for Domestic Steel & Farming",
        description: "Defend domestic manufacturers by shielding primary domestic heavy industries from allied competition.",
        political_effects: { district_approval: 10, national_approval: 3, party_loyalty: 8, war_chest: 3.0, political_capital: 6 },
        economic_effects: { unemployment_rate: -0.15, flexible_cpi: 0.15 }
      },
      {
        option_id: "C",
        label: "Demand Mandatory Strict Environmental & Labor Audits",
        description: "Ensure overseas mining operations meet certified carbon and fair-wage compliance metrics.",
        political_effects: { district_approval: 6, national_approval: 7, party_loyalty: 6, war_chest: 1.0, political_capital: 8 },
        economic_effects: { flexible_cpi: 0.05, gdp_growth: 0.20 }
      }
    ]
  },
  {
    id: "POL-POS-08",
    name: "Sovereign Debt Credit Rating Upgrade to AAA",
    polarity: "Positive",
    category: "Fiscal & Financial Markets",
    impact_min: 75,
    impact_max: 95,
    impact_tier: "Transformative",
    summary: "Global rating agencies elevate national sovereign debt to prime AAA status, lowering government borrowing costs and strengthening currency prestige.",
    economic_triggers: { fiscal_deficit_max: 4.0, debt_to_gdp_max: 85.0 },
    choices: [
      {
        option_id: "A",
        label: "Celebrate Fiscal Stewardship & Advance Deficit Reduction",
        description: "Use the credit upgrade to cement your reputation as a disciplined national fiscal leader.",
        political_effects: { district_approval: 5, national_approval: 10, party_loyalty: 8, war_chest: 3.0, political_capital: 15 },
        economic_effects: { bond_yield_10y: -0.30, currency_index: 2.5, stock_market_index: 60 }
      },
      {
        option_id: "B",
        label: "Refinance Maturing Debt & Reinvest Savings in Modernization",
        description: "Capitalize on sub-2% borrowing yields to issue 50-year century bonds for university research laboratories.",
        political_effects: { district_approval: 8, national_approval: 7, party_loyalty: 6, war_chest: 2.0, political_capital: 10 },
        economic_effects: { bond_yield_10y: -0.20, gdp_growth: 0.25 }
      },
      {
        option_id: "C",
        label: "Enact Tax Cuts for Middle-Income Earners",
        description: "Pass permanent tax bracket reductions funded by lower sovereign interest servicing expenses.",
        political_effects: { district_approval: 11, national_approval: 8, party_loyalty: 7, war_chest: 3.5, political_capital: 8 },
        economic_effects: { consumer_confidence: 8, real_wage_growth: 0.35, fiscal_deficit: 0.15 }
      }
    ]
  },
  {
    id: "POL-POS-09",
    name: "Agricultural Harvest Record & Supermarket Price Plunge",
    polarity: "Positive",
    category: "Agriculture & Cost of Living",
    impact_min: 50,
    impact_max: 72,
    impact_tier: "Moderate",
    summary: "Favorable weather and precision agronomy yield record wheat, corn, and soy harvests, dropping grocery bill inflation to zero.",
    economic_triggers: { flexible_cpi_min: 2.5 },
    choices: [
      {
        option_id: "A",
        label: "Highlight Lower Grocery Bills in Working-Class Districts",
        description: "Hold town halls at regional supermarkets holding up receipts proving the cost of living is subsiding.",
        political_effects: { district_approval: 8, national_approval: 7, party_loyalty: 4, war_chest: 1.0, political_capital: 6 },
        economic_effects: { flexible_cpi: -0.55, consumer_confidence: 6, poverty_discontent: -4.0 }
      },
      {
        option_id: "B",
        label: "Establish Grain Price Floors to Protect Family Farms",
        description: "Deploy federal commodity purchase programs to prevent agricultural bankruptcy from oversupply.",
        political_effects: { district_approval: 10, national_approval: 4, party_loyalty: 7, war_chest: 3.5, political_capital: 7 },
        economic_effects: { flexible_cpi: -0.25, fiscal_deficit: 0.10 }
      },
      {
        option_id: "C",
        label: "Authorize Humanitarian Agricultural Exports to Allied Nations",
        description: "Ship grain surplus overseas to earn diplomatic soft power and build food security goodwill.",
        political_effects: { district_approval: 5, national_approval: 8, party_loyalty: 6, war_chest: 2.0, political_capital: 10 },
        economic_effects: { export_growth: 0.25, flexible_cpi: -0.40 }
      }
    ]
  },
  {
    id: "POL-POS-10",
    name: "Small Business Deregulation & Venture Creation Wave",
    polarity: "Positive",
    category: "Enterprise & Commerce",
    impact_min: 55,
    impact_max: 75,
    impact_tier: "Moderate",
    summary: "One-stop digital business licensing and micro-loan guarantees trigger record entrepreneur filings and Main Street hiring.",
    economic_triggers: { unemployment_rate_min: 3.8 },
    choices: [
      {
        option_id: "A",
        label: "Tour Main Street Commercial Districts & Small Bakeries",
        description: "Cut ribbons with small shop owners and announce localized commercial property tax abatements.",
        political_effects: { district_approval: 9, national_approval: 6, party_loyalty: 6, war_chest: 3.5, political_capital: 7 },
        economic_effects: { unemployment_rate: -0.20, consumer_confidence: 5, gdp_growth: 0.20 }
      },
      {
        option_id: "B",
        label: "Expand Zero-Interest Micro-Loans for Female & Veteran Founders",
        description: "Target capital assistance toward traditionally under-capitalized founders to build enduring equity.",
        political_effects: { district_approval: 7, national_approval: 8, party_loyalty: 7, war_chest: 2.5, political_capital: 9 },
        economic_effects: { unemployment_rate: -0.25, poverty_discontent: -3.0 }
      },
      {
        option_id: "C",
        label: "Exempt Micro-Enterprises from Burdensome Reporting Rules",
        description: "Eliminate quarterly compliance paperwork for firms with under 25 employees.",
        political_effects: { district_approval: 8, national_approval: 7, party_loyalty: 9, war_chest: 4.5, political_capital: 8 },
        economic_effects: { gdp_growth: 0.25, stock_market_index: 35 }
      }
    ]
  },
  {
    id: "POL-POS-11",
    name: "Urban Safe Streets Initiative & Violent Crime Plummet",
    polarity: "Positive",
    category: "Justice & Community Safety",
    impact_min: 58,
    impact_max: 78,
    impact_tier: "Moderate",
    summary: "Coordinated community policing, mental health emergency response units, and youth centers yield a 30% drop in urban crime.",
    economic_triggers: { consumer_confidence_min: 65 },
    choices: [
      {
        option_id: "A",
        label: "Celebrate Law Enforcement & Community Partnerships",
        description: "Stand alongside police chiefs and social workers to tout balanced law enforcement achievements.",
        political_effects: { district_approval: 9, national_approval: 8, party_loyalty: 6, war_chest: 2.5, political_capital: 10 },
        economic_effects: { consumer_confidence: 6, housing_cost_index: 1.5 }
      },
      {
        option_id: "B",
        label: "Enact Historic Criminal Justice & Second-Chance Reforms",
        description: "Expunge non-violent records to re-integrate 100,000 citizens into the formal labor force.",
        political_effects: { district_approval: 6, national_approval: 8, party_loyalty: 5, war_chest: 1.5, political_capital: 12 },
        economic_effects: { unemployment_rate: -0.20, real_wage_growth: 0.15 }
      },
      {
        option_id: "C",
        label: "Direct Downtown Revitalization Grants into Retail Corridors",
        description: "Restore illuminated night markets and cultural districts to reignite foot traffic.",
        political_effects: { district_approval: 10, national_approval: 6, party_loyalty: 7, war_chest: 3.5, political_capital: 6 },
        economic_effects: { gdp_growth: 0.20, consumer_confidence: 7 }
      }
    ]
  },
  {
    id: "POL-POS-12",
    name: "National Vocational Apprenticeship & Skilled Trades Act",
    polarity: "Positive",
    category: "Education & Workforce",
    impact_min: 60,
    impact_max: 80,
    impact_tier: "Moderate",
    summary: "Federally accredited paid apprenticeships for electricians, plumbers, machinists, and solar installers expand debt-free career paths.",
    economic_triggers: { unemployment_rate_min: 4.0 },
    choices: [
      {
        option_id: "A",
        label: "Partner Directly with Trade Unions and Technical Colleges",
        description: "Guarantees apprentices union-scale wages and certified journeyman licensure upon completion.",
        political_effects: { district_approval: 9, national_approval: 7, party_loyalty: 8, war_chest: 3.5, political_capital: 10 },
        economic_effects: { real_wage_growth: 0.30, unemployment_rate: -0.20 }
      },
      {
        option_id: "B",
        label: "Offer Private Enterprise Apprenticeship Tax Credits",
        description: "Give industrial firms a $4,000 corporate tax credit for each apprentice hired and retained for two years.",
        political_effects: { district_approval: 6, national_approval: 7, party_loyalty: 7, war_chest: 4.0, political_capital: 6 },
        economic_effects: { gdp_growth: 0.20, unemployment_rate: -0.15 }
      },
      {
        option_id: "C",
        label: "Tie Apprenticeship Hubs to High-Growth Clean Energy Zones",
        description: "Focus training programs around electric vehicles, battery Gigafactories, and geothermal plants.",
        political_effects: { district_approval: 8, national_approval: 8, party_loyalty: 7, war_chest: 2.0, political_capital: 8 },
        economic_effects: { gdp_growth: 0.25, unemployment_rate: -0.25 }
      }
    ]
  },
  {
    id: "POL-POS-13",
    name: "Affordable Housing Zoning Overhaul & Rapid Construction Boom",
    polarity: "Positive",
    category: "Housing & Urban Development",
    impact_min: 75,
    impact_max: 95,
    impact_tier: "Transformative",
    summary: "Sweeping bipartisan zoning reforms eliminate single-family restrictions near transit stations, triggering 500,000 new starter home starts.",
    economic_triggers: { housing_cost_index_min: 105 },
    choices: [
      {
        option_id: "A",
        label: "Champion the 'YIMBY' Transit-Oriented Density Expansion",
        description: "Stand firm against suburban NIMBY opposition to unlock affordable duplexes and mid-rise apartments.",
        political_effects: { district_approval: 7, national_approval: 10, party_loyalty: 6, war_chest: 2.5, political_capital: 14 },
        economic_effects: { housing_cost_index: -4.5, flexible_cpi: -0.25, consumer_confidence: 6 }
      },
      {
        option_id: "B",
        label: "Enact First-Time Homebuyer Down-Payment Grants",
        description: "Provide $15,000 equity-building down payment assistance to young working-class families.",
        political_effects: { district_approval: 11, national_approval: 8, party_loyalty: 6, war_chest: 1.5, political_capital: 7 },
        economic_effects: { consumer_confidence: 8, fiscal_deficit: 0.25, housing_cost_index: 1.0 }
      },
      {
        option_id: "C",
        label: "Incentivize Factory-Built Modular Prefabricated Housing",
        description: "Provide federal loan guarantees to modular construction factories that build turnkey units in 60 days.",
        political_effects: { district_approval: 8, national_approval: 8, party_loyalty: 8, war_chest: 3.5, political_capital: 9 },
        economic_effects: { housing_cost_index: -3.5, unemployment_rate: -0.20, gdp_growth: 0.30 }
      }
    ]
  },
  {
    id: "POL-POS-14",
    name: "Cross-Party Parliamentary Anti-Corruption Accord",
    polarity: "Positive",
    category: "Governance & Ethics",
    impact_min: 70,
    impact_max: 88,
    impact_tier: "Major",
    summary: "Historic ethics legislation bans congressional stock trading, restricts lobbyist revolving doors, and mandates instant donor disclosures.",
    economic_triggers: { parliamentary_approval_max: 48 },
    choices: [
      {
        option_id: "A",
        label: "Co-Author the Stock Trading Ban & Divest Publicly",
        description: "Lead by personal example, placing all assets into a blind index fund and challenging opponents to follow.",
        political_effects: { district_approval: 10, national_approval: 12, party_loyalty: -3, war_chest: -4.0, political_capital: 16 },
        economic_effects: { consumer_confidence: 7, parliamentary_approval: 12 }
      },
      {
        option_id: "B",
        label: "Focus on Foreign Lobbying & Dark Money Transparency",
        description: "Channel the legislation to target foreign sovereign wealth fund lobbying while preserving domestic PACs.",
        political_effects: { district_approval: 6, national_approval: 7, party_loyalty: 8, war_chest: 3.0, political_capital: 8 },
        economic_effects: { parliamentary_approval: 6 }
      },
      {
        option_id: "C",
        label: "Strengthen Whistleblower Protections in Federal Contracting",
        description: "Award civic whistleblowers up to 25% of recovered fraudulent government procurement monies.",
        political_effects: { district_approval: 8, national_approval: 8, party_loyalty: 6, war_chest: 1.0, political_capital: 10 },
        economic_effects: { fiscal_deficit: -0.20, parliamentary_approval: 7 }
      }
    ]
  },
  {
    id: "POL-POS-15",
    name: "Defense Modernization & Strategic Peace Dividend",
    polarity: "Positive",
    category: "Defense & Foreign Policy",
    impact_min: 68,
    impact_max: 88,
    impact_tier: "Major",
    summary: "Successful diplomatic peace accords in contested maritime lanes permit a $50B defense reallocation toward domestic cyber and space readiness.",
    economic_triggers: { fiscal_deficit_min: 3.5 },
    choices: [
      {
        option_id: "A",
        label: "Reallocate Peace Dividend Directly to Veterans Healthcare",
        description: "Modernize veteran hospitals and expand comprehensive PTSD and prosthetic medical centers.",
        political_effects: { district_approval: 11, national_approval: 9, party_loyalty: 7, war_chest: 2.0, political_capital: 12 },
        economic_effects: { consumer_confidence: 6, poverty_discontent: -3.0 }
      },
      {
        option_id: "B",
        label: "Pivot Defense Spending to Quantum Cryptography & Cybersecurity",
        description: "Harden national civilian energy, financial, and telecom networks against hostile state cyberwarfare.",
        political_effects: { district_approval: 5, national_approval: 8, party_loyalty: 8, war_chest: 4.5, political_capital: 9 },
        economic_effects: { gdp_growth: 0.20 }
      },
      {
        option_id: "C",
        label: "Apply Defense Cost Savings to Structural Deficit Reduction",
        description: "Retire high-interest treasury bonds to prove fiscal responsibility and protect credit standing.",
        political_effects: { district_approval: 4, national_approval: 8, party_loyalty: 6, war_chest: 2.5, political_capital: 10 },
        economic_effects: { fiscal_deficit: -0.40, bond_yield_10y: -0.15 }
      }
    ]
  },
  {
    id: "POL-POS-16",
    name: "Record Foreign Direct Investment in Green Manufacturing",
    polarity: "Positive",
    category: "Foreign Investment & Industry",
    impact_min: 65,
    impact_max: 84,
    impact_tier: "Major",
    summary: "Allied multinational corporations announce $60B in direct capital investments across electric battery plants and zero-emission transit systems.",
    economic_triggers: { currency_index_min: 90 },
    choices: [
      {
        option_id: "A",
        label: "Host High-Profile Groundbreaking with International CEOs",
        description: "Position yourself as the premier architect of 21st-century manufacturing resurgence.",
        political_effects: { district_approval: 8, national_approval: 8, party_loyalty: 6, war_chest: 4.0, political_capital: 10 },
        economic_effects: { gdp_growth: 0.35, unemployment_rate: -0.25, stock_market_index: 45 }
      },
      {
        option_id: "B",
        label: "Mandate Apprenticeships and Local Supply-Chain Procurement",
        description: "Ensure overseas firms must purchase 50% of machine tooling from domestic small manufacturers.",
        political_effects: { district_approval: 10, national_approval: 6, party_loyalty: 8, war_chest: 2.0, political_capital: 8 },
        economic_effects: { unemployment_rate: -0.20, real_wage_growth: 0.25 }
      },
      {
        option_id: "C",
        label: "Establish National Technology Transfer Protocols",
        description: "Guarantee domestic universities receive co-patents on next-generation battery chemistries.",
        political_effects: { district_approval: 6, national_approval: 8, party_loyalty: 6, war_chest: 2.5, political_capital: 9 },
        economic_effects: { gdp_growth: 0.25 }
      }
    ]
  },
  {
    id: "POL-POS-17",
    name: "Commercial Nuclear Fusion Pilot Reactor Grid Connection",
    polarity: "Positive",
    category: "Science & Energy",
    impact_min: 80,
    impact_max: 98,
    impact_tier: "Transformative",
    summary: "Scientists and private consortiums successfully sustain net-positive Q>5 fusion plasma, feeding clean baseline energy into the national grid.",
    economic_triggers: { gdp_growth_min: 1.5 },
    choices: [
      {
        option_id: "A",
        label: "Launch National 'Project Promethium' Fusion Scale-Up Program",
        description: "Authorize $20B in loan guarantees to build ten commercial fusion reactors across regional power corridors.",
        political_effects: { district_approval: 7, national_approval: 12, party_loyalty: 7, war_chest: 3.5, political_capital: 18 },
        economic_effects: { gdp_growth: 0.45, stock_market_index: 80, flexible_cpi: -0.30 }
      },
      {
        option_id: "B",
        label: "Direct Reactor Placement to Coal & Heavy Industrial Regions",
        description: "Replace retiring coal power plants with fusion stations, guaranteeing jobs for existing energy workers.",
        political_effects: { district_approval: 11, national_approval: 8, party_loyalty: 9, war_chest: 3.0, political_capital: 12 },
        economic_effects: { unemployment_rate: -0.30, poverty_discontent: -5.0 }
      },
      {
        option_id: "C",
        label: "Establish Global Nuclear Fusion Export Licensing Standards",
        description: "Ensure our nation controls international safety standards and exports reactor hardware to allied democracies.",
        political_effects: { district_approval: 5, national_approval: 10, party_loyalty: 7, war_chest: 4.5, political_capital: 12 },
        economic_effects: { export_growth: 0.40, currency_index: 2.0 }
      }
    ]
  },
  {
    id: "POL-POS-18",
    name: "Sovereign Wealth Fund Record Investment Dividend Payout",
    polarity: "Positive",
    category: "Public Assets & Fiscal",
    impact_min: 60,
    impact_max: 80,
    impact_tier: "Moderate",
    summary: "Prudent global asset management generates an unprecedented $45B sovereign wealth surplus, creating legislative options for national distribution.",
    economic_triggers: { stock_market_index_min: 2700 },
    choices: [
      {
        option_id: "A",
        label: "Issue a Direct 'Citizen Prosperity Dividend' to Working Families",
        description: "Provide $800 to every citizen earning under $75,000 to offset inflationary pressures.",
        political_effects: { district_approval: 10, national_approval: 9, party_loyalty: 5, war_chest: 1.0, political_capital: 8 },
        economic_effects: { consumer_confidence: 9, poverty_discontent: -6.0, flexible_cpi: 0.15 }
      },
      {
        option_id: "B",
        label: "Lock Surplus into Permanent Public Pension Solvency",
        description: "Shore up municipal and national retirement trust funds for the next four decades.",
        political_effects: { district_approval: 7, national_approval: 8, party_loyalty: 8, war_chest: 3.0, political_capital: 12 },
        economic_effects: { bond_yield_10y: -0.15, consumer_confidence: 6 }
      },
      {
        option_id: "C",
        label: "Invest Directly in Sovereign High-Speed Rail Bonds",
        description: "Commit the payout to capital bonds connecting major commercial hubs with 220 mph bullet trains.",
        political_effects: { district_approval: 6, national_approval: 7, party_loyalty: 7, war_chest: 3.5, political_capital: 9 },
        economic_effects: { gdp_growth: 0.30, unemployment_rate: -0.15 }
      }
    ]
  },
  {
    id: "POL-POS-19",
    name: "National High-Speed Freight Logistics Corridor Completion",
    polarity: "Positive",
    category: "Transportation & Supply Chain",
    impact_min: 58,
    impact_max: 76,
    impact_tier: "Moderate",
    summary: "Automated rail freight bypasses and automated deepwater terminal cranes cut cross-country cargo transit times by 48 hours.",
    economic_triggers: { gdp_growth_min: 1.0 },
    choices: [
      {
        option_id: "A",
        label: "Showcase Shorter Shipping Delays for Consumer Goods",
        description: "Highlight delivery speedups and retail price stability in joint press events with national retailers.",
        political_effects: { district_approval: 7, national_approval: 7, party_loyalty: 5, war_chest: 3.0, political_capital: 6 },
        economic_effects: { flexible_cpi: -0.30, gdp_growth: 0.20 }
      },
      {
        option_id: "B",
        label: "Mandate Domestic Priority Freight Shipping Windows",
        description: "Ensure domestic farm produce and critical medicines receive priority rail tracking over imported consumer goods.",
        political_effects: { district_approval: 9, national_approval: 6, party_loyalty: 7, war_chest: 2.5, political_capital: 7 },
        economic_effects: { flexible_cpi: -0.20, unemployment_rate: -0.10 }
      },
      {
        option_id: "C",
        label: "Integrate Green Electric Locomotive Fleets",
        description: "Subsidize rail carriers converting diesel rolling stock to overhead electric and hydrogen fuel cells.",
        political_effects: { district_approval: 6, national_approval: 8, party_loyalty: 8, war_chest: 2.0, political_capital: 8 },
        economic_effects: { flexible_cpi: -0.15, gdp_growth: 0.25 }
      }
    ]
  },
  {
    id: "POL-POS-20",
    name: "Senior Citizens Social Security Longevity Guarantee Pact",
    polarity: "Positive",
    category: "Pensions & Senior Welfare",
    impact_min: 68,
    impact_max: 88,
    impact_tier: "Major",
    summary: "Bipartisan accord locks in cost-of-living adjustments (COLA) and eliminates income taxes on Social Security benefits for middle-class retirees.",
    economic_triggers: { months_to_election_max: 20 },
    choices: [
      {
        option_id: "A",
        label: "Host Senior Citizen Town Hall Blitz Across the State",
        description: "Deliver keynote addresses to retiree associations highlighting guaranteed pensions and healthcare security.",
        political_effects: { district_approval: 12, national_approval: 8, party_loyalty: 6, war_chest: 2.5, political_capital: 10 },
        economic_effects: { consumer_confidence: 8, poverty_discontent: -4.0 }
      },
      {
        option_id: "B",
        label: "Fund via High-Earner Payroll Contribution Cap Removal",
        description: "Subject annual incomes above $400,000 to the standard pension payroll tax to ensure 75-year solvency.",
        political_effects: { district_approval: 7, national_approval: 9, party_loyalty: 8, war_chest: -2.0, political_capital: 14 },
        economic_effects: { fiscal_deficit: -0.35, wealth_inequality_gini: -1.0 }
      },
      {
        option_id: "C",
        label: "Allow Voluntary Part-Time Work Without Pension Benefit Penalties",
        description: "Let healthy seniors work up to 20 hours a week without sacrificing their earned retirement checks.",
        political_effects: { district_approval: 9, national_approval: 8, party_loyalty: 8, war_chest: 3.5, political_capital: 8 },
        economic_effects: { unemployment_rate: -0.15, real_wage_growth: 0.15 }
      }
    ]
  },
  {
    id: "POL-POS-21",
    name: "Municipal Clean Drinking Water & Lead Pipe Replacement Milestone",
    polarity: "Positive",
    category: "Public Health & Environment",
    impact_min: 55,
    impact_max: 75,
    impact_tier: "Moderate",
    summary: "National replacement program successfully removes 1,000,000 legacy lead water service lines, eliminating neurotoxins from municipal water systems.",
    economic_triggers: { public_approval_max: 55 },
    choices: [
      {
        option_id: "A",
        label: "Hold Public Toast with Purified Tap Water at an Elementary School",
        description: "Generate emotional news headlines drinking certified clean water with neighborhood parents and teachers.",
        political_effects: { district_approval: 11, national_approval: 8, party_loyalty: 6, war_chest: 1.5, political_capital: 8 },
        economic_effects: { consumer_confidence: 6, poverty_discontent: -3.5 }
      },
      {
        option_id: "B",
        label: "Establish Stricter National PFAS & Chemical Water Standards",
        description: "Mandate polluter-pays accountability requiring chemical manufacturers to finance industrial filtration.",
        political_effects: { district_approval: 7, national_approval: 10, party_loyalty: 7, war_chest: -2.0, political_capital: 12 },
        economic_effects: { consumer_confidence: 7 }
      },
      {
        option_id: "C",
        label: "Contract Local Minority & Veteran-Owned Plumbing Firms",
        description: "Direct municipal plumbing subcontracts to local neighborhood tradespeople.",
        political_effects: { district_approval: 9, national_approval: 6, party_loyalty: 7, war_chest: 2.5, political_capital: 6 },
        economic_effects: { unemployment_rate: -0.15, real_wage_growth: 0.20 }
      }
    ]
  },
  {
    id: "POL-POS-22",
    name: "Commercial Space Exploration & High-Bandwidth Satellite Network",
    polarity: "Positive",
    category: "Aerospace & Technology",
    impact_min: 60,
    impact_max: 80,
    impact_tier: "Moderate",
    summary: "Domestic space consortium launches next-generation low-earth-orbit constellation providing free gigabit internet to every rural school.",
    economic_triggers: { gdp_growth_min: 1.8 },
    choices: [
      {
        option_id: "A",
        label: "Preside Over the Rural Digital Equality Inauguration",
        description: "Deliver remarks from a remote mountain schoolhouse connected to gigabit educational resources.",
        political_effects: { district_approval: 10, national_approval: 8, party_loyalty: 6, war_chest: 3.5, political_capital: 8 },
        economic_effects: { consumer_confidence: 6, gdp_growth: 0.15 }
      },
      {
        option_id: "B",
        label: "Expand Aerospace Defense Contracts for Orbital Defense",
        description: "Direct commercial satellite bus manufacturing into high-security military early-warning systems.",
        political_effects: { district_approval: 6, national_approval: 7, party_loyalty: 8, war_chest: 5.0, political_capital: 9 },
        economic_effects: { gdp_growth: 0.25, export_growth: 0.20 }
      },
      {
        option_id: "C",
        label: "Negotiate Global Space Debris Mitigation Treaties",
        description: "Lead international diplomatic accords mandating automated de-orbiting thrusters on all commercial rockets.",
        political_effects: { district_approval: 5, national_approval: 9, party_loyalty: 6, war_chest: 1.5, political_capital: 11 },
        economic_effects: { international_standing: 8 }
      }
    ]
  },
  {
    id: "POL-POS-23",
    name: "National Tourism & International Cultural Festival Windfall",
    polarity: "Positive",
    category: "Commerce & Culture",
    impact_min: 45,
    impact_max: 65,
    impact_tier: "Minor",
    summary: "Hosting global sporting and arts championships drives millions of international visitors, stimulating hotel, dining, and transit tax revenues.",
    economic_triggers: { currency_index_max: 104 },
    choices: [
      {
        option_id: "A",
        label: "Spotlight Local Hospitality Workers & Culinary Culture",
        description: "Host welcoming receptions for international journalists highlighting district hospitality and cuisine.",
        political_effects: { district_approval: 8, national_approval: 5, party_loyalty: 5, war_chest: 2.5, political_capital: 5 },
        economic_effects: { gdp_growth: 0.20, unemployment_rate: -0.15, consumer_confidence: 5 }
      },
      {
        option_id: "B",
        label: "Reinvest Hotel Occupancy Taxes in Transit Stations",
        description: "Dedicate international visitor hotel tax proceeds directly to clean municipal subway maintenance.",
        political_effects: { district_approval: 7, national_approval: 6, party_loyalty: 7, war_chest: 2.0, political_capital: 6 },
        economic_effects: { fiscal_deficit: -0.10, gdp_growth: 0.15 }
      },
      {
        option_id: "C",
        label: "Fast-Track Cultural & Sports Visa Modernization",
        description: "Streamline international visitor visas while maintaining strict border verification protocols.",
        political_effects: { district_approval: 5, national_approval: 7, party_loyalty: 6, war_chest: 3.0, political_capital: 7 },
        economic_effects: { gdp_growth: 0.25 }
      }
    ]
  },
  {
    id: "POL-POS-24",
    name: "Biotech Oncology Breakthrough & National Clinical Trial Triumph",
    polarity: "Positive",
    category: "Life Sciences & Public Health",
    impact_min: 75,
    impact_max: 95,
    impact_tier: "Transformative",
    summary: "National biomedical research institute develops mRNA personalized cancer immunotherapy demonstrating 80% remission rates across clinical trials.",
    economic_triggers: { consumer_confidence_min: 70 },
    choices: [
      {
        option_id: "A",
        label: "Pass the Universal Cancer Immunotherapy Coverage Mandate",
        description: "Require every public and private insurance provider to cover the breakthrough treatment with zero copay.",
        political_effects: { district_approval: 12, national_approval: 12, party_loyalty: 7, war_chest: -1.0, political_capital: 16 },
        economic_effects: { consumer_confidence: 10, poverty_discontent: -5.0 }
      },
      {
        option_id: "B",
        label: "Authorize Commercial Manufacturing Licensing Hubs",
        description: "Partner with domestic bio-manufacturing plants to produce therapy doses for worldwide export.",
        political_effects: { district_approval: 8, national_approval: 9, party_loyalty: 8, war_chest: 4.5, political_capital: 10 },
        economic_effects: { gdp_growth: 0.35, export_growth: 0.40, stock_market_index: 55 }
      },
      {
        option_id: "C",
        label: "Double National Science & Medical Research Endowments",
        description: "Capitalize on national pride to permanently boost university biomedical research grants.",
        political_effects: { district_approval: 6, national_approval: 9, party_loyalty: 7, war_chest: 2.0, political_capital: 11 },
        economic_effects: { gdp_growth: 0.20, fiscal_deficit: 0.15 }
      }
    ]
  },
  {
    id: "POL-POS-25",
    name: "Fiscal Transparency & Balanced Budget Surplus Dividend",
    polarity: "Positive",
    category: "Fiscal Governance & Trust",
    impact_min: 80,
    impact_max: 98,
    impact_tier: "Transformative",
    summary: "Rigorous budget discipline and booming revenue receipts generate the first balanced national fiscal budget in twenty-five years.",
    economic_triggers: { fiscal_deficit_max: 1.5, debt_to_gdp_max: 75 },
    choices: [
      {
        option_id: "A",
        label: "Cement Legacy as Master of National Fiscal Discipline",
        description: "Lead televised joint address celebrating balanced accounts and protecting the currency for future generations.",
        political_effects: { district_approval: 9, national_approval: 14, party_loyalty: 9, war_chest: 5.0, political_capital: 20 },
        economic_effects: { bond_yield_10y: -0.35, currency_index: 3.0, inflation_cpi: -0.30, debt_to_gdp: -2.0 }
      },
      {
        option_id: "B",
        label: "Pass Balanced Mix of Middle-Class Tax Relief & Rainy-Day Reserves",
        description: "Deposit half the surplus in emergency reserves and return the other half via earned income tax cuts.",
        political_effects: { district_approval: 11, national_approval: 10, party_loyalty: 8, war_chest: 4.0, political_capital: 14 },
        economic_effects: { consumer_confidence: 9, real_wage_growth: 0.40, debt_to_gdp: -1.0 }
      },
      {
        option_id: "C",
        label: "Retire Outstanding High-Coupon Sovereign Bonds",
        description: "Repurchase 30-year high-interest treasury bonds to permanently reduce future taxpayer debt service obligations.",
        political_effects: { district_approval: 5, national_approval: 10, party_loyalty: 8, war_chest: 3.5, political_capital: 15 },
        economic_effects: { bond_yield_10y: -0.40, debt_to_gdp: -2.5 }
      }
    ]
  }
];

const NEGATIVE_EVENTS = [
  {
    id: "POL-NEG-01",
    name: "Geopolitical Oil Shock & Refining Bottleneck Crisis",
    polarity: "Negative",
    category: "Energy & Foreign Crisis",
    impact_min: 75,
    impact_max: 95,
    impact_tier: "Transformative",
    summary: "Strait of Hormuz tanker skirmishes and domestic refinery fires cause crude oil prices to surge 45%, spiking gas pump prices and voter fury.",
    economic_triggers: { inflation_cpi_min: 3.2 },
    choices: [
      {
        option_id: "A",
        label: "Release Strategic Petroleum Reserves & Suspend Gas Taxes",
        description: "Flood market with 50M barrels from salt caverns and suspend federal gas excise taxes for 90 days.",
        political_effects: { district_approval: 7, national_approval: 5, party_loyalty: 3, war_chest: 1.0, political_capital: -5 },
        economic_effects: { flexible_cpi: -0.45, fiscal_deficit: 0.35, consumer_confidence: 4 }
      },
      {
        option_id: "B",
        label: "Enact Windfall Profits Tax on Big Oil Conglomerates",
        description: "Tax record oil company refining margins at 50% and distribute funds as emergency heating checks.",
        political_effects: { district_approval: 9, national_approval: 8, party_loyalty: 6, war_chest: -4.5, political_capital: 10 },
        economic_effects: { poverty_discontent: -4.0, stock_market_index: -40, flexible_cpi: -0.10 }
      },
      {
        option_id: "C",
        label: "Expedite Domestic Energy Drilling & Pipeline Permits",
        description: "Waive environmental review timelines for natural gas pipelines and offshore drilling leases.",
        political_effects: { district_approval: 4, national_approval: 5, party_loyalty: 8, war_chest: 6.0, political_capital: -4 },
        economic_effects: { gdp_growth: 0.25, flexible_cpi: -0.20 }
      }
    ]
  },
  {
    id: "POL-NEG-02",
    name: "Mortgage Interest Rate Shock & Buyer Rebellion",
    polarity: "Negative",
    category: "Housing & Monetary Policy",
    impact_min: 70,
    impact_max: 90,
    impact_tier: "Transformative",
    summary: "Central bank rate hikes push 30-year mortgage rates to 7.8%, freezing home sales, crushing construction jobs, and enraging young families.",
    economic_triggers: { interest_rate_min: 4.5, housing_cost_index_min: 108 },
    choices: [
      {
        option_id: "A",
        label: "Publicly Rebuke Central Bank Chair & Demand Rate Relief",
        description: "Summon the Central Bank Governor to a fiery televised committee hearing to demand an immediate pause.",
        political_effects: { district_approval: 8, national_approval: 7, party_loyalty: 4, war_chest: 1.0, political_capital: 6 },
        economic_effects: { market_credibility: -15, currency_index: -1.5, bond_yield_10y: 0.20 }
      },
      {
        option_id: "B",
        label: "Subsidize 3-2-1 Mortgage Interest Rate Buydowns for Buyers",
        description: "Provide emergency federal buy-downs lowering effective mortgage rates to 4.5% for first-time buyers.",
        political_effects: { district_approval: 10, national_approval: 6, party_loyalty: 6, war_chest: 2.0, political_capital: 4 },
        economic_effects: { fiscal_deficit: 0.40, housing_cost_index: 2.0, consumer_confidence: 5 }
      },
      {
        option_id: "C",
        label: "Explain Macroeconomic Reality & Defend Central Bank Independence",
        description: "Show political courage by explaining that conquering inflation requires temporary mortgage discipline.",
        political_effects: { district_approval: -8, national_approval: 4, party_loyalty: 7, war_chest: 4.0, political_capital: 12 },
        economic_effects: { market_credibility: 10, inflation_cpi: -0.25, bond_yield_10y: -0.15 }
      }
    ]
  },
  {
    id: "POL-NEG-03",
    name: "Cost-of-Living Stagflation & Grocery Price Protests",
    polarity: "Negative",
    category: "Economy & Social Unrest",
    impact_min: 75,
    impact_max: 95,
    impact_tier: "Transformative",
    summary: "Persistent food packaging and egg/milk inflation alongside stagnating real wages triggers nationwide grocery boycott movements.",
    economic_triggers: { inflation_cpi_min: 4.0, gdp_growth_max: 1.2 },
    choices: [
      {
        option_id: "A",
        label: "Launch National Price Gouging & Supermarket Oligopoly Probe",
        description: "Direct federal antitrust regulators to subpoena grocery conglomerates and cartel middle-men.",
        political_effects: { district_approval: 9, national_approval: 8, party_loyalty: 6, war_chest: -3.5, political_capital: 8 },
        economic_effects: { consumer_confidence: 6, flexible_cpi: -0.20 }
      },
      {
        option_id: "B",
        label: "Temporarily Double Emergency Food Assistance (SNAP/WIC)",
        description: "Expand nutritional assistance vouchers to cover all households under 200% of the poverty line.",
        political_effects: { district_approval: 8, national_approval: 6, party_loyalty: 6, war_chest: 1.0, political_capital: 4 },
        economic_effects: { poverty_discontent: -6.0, fiscal_deficit: 0.35, flexible_cpi: 0.10 }
      },
      {
        option_id: "C",
        label: "Cut Food Import Tariffs & Agricultural Protectionist Duties",
        description: "Permit cheap foreign agricultural and dairy imports to flood supermarkets, lowering retail prices.",
        political_effects: { district_approval: -4, national_approval: 6, party_loyalty: 4, war_chest: 3.0, political_capital: 6 },
        economic_effects: { flexible_cpi: -0.45, unemployment_rate: 0.15 }
      }
    ]
  },
  {
    id: "POL-NEG-04",
    name: "Critical Energy Grid Cyberattack & Extended Regional Blackout",
    polarity: "Negative",
    category: "Infrastructure & National Security",
    impact_min: 70,
    impact_max: 90,
    impact_tier: "Major",
    summary: "Hostile foreign state APT hackers disable substations across four major industrial states, cutting power to 8 million citizens for 96 hours.",
    economic_triggers: { fiscal_deficit_min: 4.0 },
    choices: [
      {
        option_id: "A",
        label: "Deploy National Guard & Emergency Mobile Generators",
        description: "Mobilize military engineering battalions to restore hospital, water, and emergency shelter power.",
        political_effects: { district_approval: 8, national_approval: 7, party_loyalty: 7, war_chest: 1.5, political_capital: 6 },
        economic_effects: { consumer_confidence: 4, fiscal_deficit: 0.20, gdp_growth: -0.20 }
      },
      {
        option_id: "B",
        label: "Retaliate with Offensive Cyber Operations & Severe Sanctions",
        description: "Authorize cyber command strikes against foreign adversary infrastructure and freeze offshore oligarch assets.",
        political_effects: { district_approval: 6, national_approval: 9, party_loyalty: 8, war_chest: 3.5, political_capital: 12 },
        economic_effects: { currency_index: 1.5, gdp_growth: -0.15 }
      },
      {
        option_id: "C",
        label: "Mandate Air-Gapped Grid Isolation & Federal Cyber Standards",
        description: "Require all power utility operators to physically disconnect industrial control systems from the public web.",
        political_effects: { district_approval: 5, national_approval: 7, party_loyalty: 6, war_chest: -2.0, political_capital: 8 },
        economic_effects: { gdp_growth: -0.10, electricity_rates: 0.15 }
      }
    ]
  },
  {
    id: "POL-NEG-05",
    name: "High-Profile Campaign Finance & Dark Money Ethics Scandal",
    polarity: "Negative",
    category: "Ethics & Governance",
    impact_min: 65,
    impact_max: 85,
    impact_tier: "Major",
    summary: "Investigative reporters expose undisclosed luxury jet travel and offshore PAC contributions flowing to key legislative committee leaders.",
    economic_triggers: { parliamentary_approval_max: 52 },
    choices: [
      {
        option_id: "A",
        label: "Call for Immediate Ethics Committee Inquiries & Resignations",
        description: "Demand full accountability, forcing implicated party colleagues to surrender their gavels.",
        political_effects: { district_approval: 9, national_approval: 10, party_loyalty: -10, war_chest: -4.0, political_capital: 8 },
        economic_effects: { parliamentary_approval: 4 }
      },
      {
        option_id: "B",
        label: "Dismiss as Partisan Smear Campaign & Circle Party Wagons",
        description: "Defend party leadership vigorously on cable news, attacking the media's ideological bias.",
        political_effects: { district_approval: -6, national_approval: -8, party_loyalty: 12, war_chest: 5.0, political_capital: -5 },
        economic_effects: { parliamentary_approval: -8 }
      },
      {
        option_id: "C",
        label: "Introduce Comprehensive Clean Campaign Public Finance Bill",
        description: "Pivot the controversy into systemic reform, proposing small-donor matching vouchers.",
        political_effects: { district_approval: 6, national_approval: 8, party_loyalty: 2, war_chest: -2.5, political_capital: 12 },
        economic_effects: { parliamentary_approval: 7 }
      }
    ]
  },
  {
    id: "POL-NEG-06",
    name: "Emergency Room Nurse & Healthcare Personnel Nationwide Strike",
    polarity: "Negative",
    category: "Healthcare & Labor",
    impact_min: 68,
    impact_max: 88,
    impact_tier: "Major",
    summary: "Exhausted medical staff strike over severe nurse-to-patient staffing ratios and uncompetitive wages, freezing elective surgeries.",
    economic_triggers: { real_wage_growth_max: 0.5 },
    choices: [
      {
        option_id: "A",
        label: "Enact Mandatory Federal Safe Staffing Ratio Legislation",
        description: "Mandate 1-to-4 nurse staffing ratios nationally, siding decisively with medical labor unions.",
        political_effects: { district_approval: 9, national_approval: 8, party_loyalty: 7, war_chest: 3.5, political_capital: 10 },
        economic_effects: { consumer_confidence: 6, real_wage_growth: 0.25, flexible_cpi: 0.15 }
      },
      {
        option_id: "B",
        label: "Invoke Emergency Injunction to Force Strikers Back to Hospitals",
        description: "Declare a public health emergency, compelling cooling-off mediation while hospitals remain open.",
        political_effects: { district_approval: -5, national_approval: 4, party_loyalty: 6, war_chest: 4.5, political_capital: -3 },
        economic_effects: { consumer_confidence: -2, gdp_growth: 0.10 }
      },
      {
        option_id: "C",
        label: "Create $10B Emergency Healthcare Retention & Loan Forgiveness Fund",
        description: "Provide $25,000 nursing student debt forgiveness in exchange for 3-year public hospital service commitments.",
        political_effects: { district_approval: 8, national_approval: 8, party_loyalty: 6, war_chest: 2.0, political_capital: 8 },
        economic_effects: { fiscal_deficit: 0.25, unemployment_rate: -0.15 }
      }
    ]
  },
  {
    id: "POL-NEG-07",
    name: "Border Logistics Bottleneck & Humanitarian Shelter Crunch",
    polarity: "Negative",
    category: "Immigration & Border Security",
    impact_min: 65,
    impact_max: 85,
    impact_tier: "Major",
    summary: "A surge in asylum applications overwhelms regional processing facilities, leading to bitter inter-state busing clashes and municipal budget strain.",
    economic_triggers: { public_approval_max: 50 },
    choices: [
      {
        option_id: "A",
        label: "Enact Comprehensive Emergency Border Modernization & Enforcement",
        description: "Deploy automated surveillance, hire 2,000 asylum judges, and increase border security personnel.",
        political_effects: { district_approval: 8, national_approval: 8, party_loyalty: 8, war_chest: 3.0, political_capital: 10 },
        economic_effects: { fiscal_deficit: 0.20, consumer_confidence: 4 }
      },
      {
        option_id: "B",
        label: "Expedite Work Permits for Screened Asylum Applicants",
        description: "Allow asylum seekers to take open jobs in agriculture, hospitality, and construction within 30 days.",
        political_effects: { district_approval: -4, national_approval: 5, party_loyalty: 5, war_chest: 2.0, political_capital: 6 },
        economic_effects: { unemployment_rate: 0.15, flexible_cpi: -0.20, gdp_growth: 0.20 }
      },
      {
        option_id: "C",
        label: "Provide Emergency Federal Block Grants to Impacted Cities",
        description: "Reimburse mayors and governors directly for shelter, sanitation, and bilingual schooling costs.",
        political_effects: { district_approval: 6, national_approval: 5, party_loyalty: 6, war_chest: 1.5, political_capital: 4 },
        economic_effects: { fiscal_deficit: 0.30, poverty_discontent: -2.0 }
      }
    ]
  },
  {
    id: "POL-NEG-08",
    name: "Sovereign Bond Yield Spike & Debt Ceiling Brinkmanship",
    polarity: "Negative",
    category: "Fiscal Impasse & Financial Markets",
    impact_min: 78,
    impact_max: 98,
    impact_tier: "Transformative",
    summary: "Partisan deadlock over statutory borrowing limits sends 10-year treasury yields past 5.5%, causing credit rating agencies to issue downgrade warnings.",
    economic_triggers: { debt_to_gdp_min: 78.0, fiscal_deficit_min: 5.0 },
    choices: [
      {
        option_id: "A",
        label: "Refuse Negotiation & Demand an 'Unconditional Clean Ceiling Raise'",
        description: "Hold the line on party principles, betting the opposition will blink before financial market default.",
        political_effects: { district_approval: -6, national_approval: -4, party_loyalty: 10, war_chest: 2.0, political_capital: -8 },
        economic_effects: { stock_market_index: -120, bond_yield_10y: 0.40, market_credibility: -15 }
      },
      {
        option_id: "B",
        label: "Broker Grand Bipartisan Fiscal Compromise with Spending Caps",
        description: "Trade discretionary budget caps for a 2-year borrowing limit suspension, calming bond markets.",
        political_effects: { district_approval: 5, national_approval: 9, party_loyalty: -6, war_chest: 4.0, political_capital: 14 },
        economic_effects: { bond_yield_10y: -0.35, stock_market_index: 80, fiscal_deficit: -0.35 }
      },
      {
        option_id: "C",
        label: "Invoke Constitutional Executive Authority to Pay Bondholders",
        description: "Rely on legal emergency doctrines to instruct the Treasury to issue bonds without parliamentary approval.",
        political_effects: { district_approval: 3, national_approval: 6, party_loyalty: 5, war_chest: 1.0, political_capital: 4 },
        economic_effects: { currency_index: -1.0, bond_yield_10y: -0.10 }
      }
    ]
  },
  {
    id: "POL-NEG-09",
    name: "Severe Agricultural Drought & Grain Export Restrictions",
    polarity: "Negative",
    category: "Climate & Agriculture",
    impact_min: 65,
    impact_max: 85,
    impact_tier: "Major",
    summary: "Historic heatwaves drop major river reservoir levels to historic lows, withering winter wheat and triggering agricultural water rationing.",
    economic_triggers: { flexible_cpi_min: 3.5 },
    choices: [
      {
        option_id: "A",
        label: "Pass Emergency Agricultural Crop Disaster Relief Package",
        description: "Provide $12B in emergency indemnity checks to prevent widespread farm foreclosures.",
        political_effects: { district_approval: 12, national_approval: 5, party_loyalty: 7, war_chest: 3.5, political_capital: 6 },
        economic_effects: { fiscal_deficit: 0.30, flexible_cpi: 0.15 }
      },
      {
        option_id: "B",
        label: "Temporarily Restrict Grain Exports to Keep Food Prices Down",
        description: "Ban foreign grain shipments to ensure domestic feed mills and bakers have affordable supplies.",
        political_effects: { district_approval: -4, national_approval: 8, party_loyalty: 5, war_chest: -2.0, political_capital: 6 },
        economic_effects: { flexible_cpi: -0.40, export_growth: -0.35 }
      },
      {
        option_id: "C",
        label: "Fund Desalination & Interstate Water Pipeline Corridors",
        description: "Commit long-term infrastructure funding to pump brackish water and build coastal desalination plants.",
        political_effects: { district_approval: 6, national_approval: 7, party_loyalty: 6, war_chest: 3.0, political_capital: 8 },
        economic_effects: { gdp_growth: 0.20, fiscal_deficit: 0.25 }
      }
    ]
  },
  {
    id: "POL-NEG-10",
    name: "Defense Contractor Procurement Kickback Investigation",
    polarity: "Negative",
    category: "Defense & Corruption",
    impact_min: 60,
    impact_max: 80,
    impact_tier: "Major",
    summary: "Auditors discover $14B in unverified cost overruns and counterfeit metallurgical components on naval submarine hulls.",
    economic_triggers: { parliamentary_approval_max: 45 },
    choices: [
      {
        option_id: "A",
        label: "Demand Total Cancellation of Tainted Contracts & Clawbacks",
        description: "Sue the defense mega-contractors, freezing executive bonuses and demanding full taxpayer restitution.",
        political_effects: { district_approval: 8, national_approval: 11, party_loyalty: -5, war_chest: -5.0, political_capital: 12 },
        economic_effects: { fiscal_deficit: -0.20, unemployment_rate: 0.10 }
      },
      {
        option_id: "B",
        label: "Protect District Shipyard Jobs with Strict Supervisory Oversight",
        description: "Protect skilled welder and machinist jobs by imposing federal managers on the shipyard rather than canceling work.",
        political_effects: { district_approval: 11, national_approval: 4, party_loyalty: 7, war_chest: 4.0, political_capital: 5 },
        economic_effects: { unemployment_rate: -0.15, fiscal_deficit: 0.10 }
      },
      {
        option_id: "C",
        label: "Replace Cost-Plus Contracts with Fixed-Price Performance Mandates",
        description: "Permanently outlaw cost-plus defense procurement, forcing contractors to absorb all overruns.",
        political_effects: { district_approval: 6, national_approval: 8, party_loyalty: 7, war_chest: 2.0, political_capital: 10 },
        economic_effects: { fiscal_deficit: -0.30, gdp_growth: 0.10 }
      }
    ]
  },
  {
    id: "POL-NEG-11",
    name: "Commercial Real Estate Loan Default Wave & Downtown Crisis",
    polarity: "Negative",
    category: "Banking & Urban Centers",
    impact_min: 68,
    impact_max: 88,
    impact_tier: "Major",
    summary: "Remote work vacancy rates and elevated interest rates cause 40-story downtown office towers to sell for 60% discounts, threatening regional banks.",
    economic_triggers: { interest_rate_min: 4.0, bank_lending_rate_min: 6.0 },
    choices: [
      {
        option_id: "A",
        label: "Subsidize Commercial-to-Residential Apartment Conversions",
        description: "Provide tax credits to developers gutting vacant office buildings into 20,000 downtown residential units.",
        political_effects: { district_approval: 8, national_approval: 7, party_loyalty: 6, war_chest: 4.0, political_capital: 8 },
        economic_effects: { housing_cost_index: -2.0, gdp_growth: 0.20, unemployment_rate: -0.15 }
      },
      {
        option_id: "B",
        label: "Let Speculative Real Estate Equity Suffer Foreclosure",
        description: "Refuse bailouts for private equity landlords, letting real estate market prices reset naturally.",
        political_effects: { district_approval: 6, national_approval: 8, party_loyalty: 5, war_chest: -3.0, political_capital: 10 },
        economic_effects: { stock_market_index: -45, bank_lending_rate: 0.15 }
      },
      {
        option_id: "C",
        label: "Require Federal Employees to Return to Downtown Offices 5 Days a Week",
        description: "Mandate public workforce presence to revitalize struggling restaurants, dry cleaners, and transit systems.",
        political_effects: { district_approval: -4, national_approval: 5, party_loyalty: 6, war_chest: 3.0, political_capital: 4 },
        economic_effects: { consumer_confidence: 4, gdp_growth: 0.15 }
      }
    ]
  },
  {
    id: "POL-NEG-12",
    name: "Retaliatory Agricultural & Steel Tariffs from Major Trade Partner",
    polarity: "Negative",
    category: "Trade & Geopolitics",
    impact_min: 65,
    impact_max: 85,
    impact_tier: "Major",
    summary: "Foreign trade bloc enacts targeted 25% retaliatory tariffs on domestic pork, soybeans, aerospace, and specialized steel exports.",
    economic_triggers: { currency_index_min: 102 },
    choices: [
      {
        option_id: "A",
        label: "Provide Emergency Export Bridge Subsidies to Impacted Farmers",
        description: "Shield domestic producers from foreign economic coercion with direct government commodity purchases.",
        political_effects: { district_approval: 10, national_approval: 5, party_loyalty: 7, war_chest: 3.5, political_capital: 6 },
        economic_effects: { fiscal_deficit: 0.25, export_growth: -0.20 }
      },
      {
        option_id: "B",
        label: "Escalate with Symmetrical Tariffs on Luxury Imports",
        description: "Slap 35% duties on foreign luxury autos, cosmetics, and fine liquors to force negotiators back to the table.",
        political_effects: { district_approval: 6, national_approval: 7, party_loyalty: 8, war_chest: 2.0, political_capital: 8 },
        economic_effects: { flexible_cpi: 0.25, currency_index: -1.0 }
      },
      {
        option_id: "C",
        label: "De-escalate via World Trade Organization Bilateral Dispute Panels",
        description: "Choose multilateral legal arbitration and offer compromise on technical digital services taxes.",
        political_effects: { district_approval: -3, national_approval: 7, party_loyalty: 5, war_chest: 3.5, political_capital: 6 },
        economic_effects: { export_growth: 0.15, flexible_cpi: -0.10 }
      }
    ]
  },
  {
    id: "POL-NEG-13",
    name: "Automotive & Manufacturing Plant Automation Mass Layoffs",
    polarity: "Negative",
    category: "Industry & Labor",
    impact_min: 65,
    impact_max: 85,
    impact_tier: "Major",
    summary: "Major automaker retools assembly lines with humanoid robotics and automated stamping presses, laying off 12,000 autoworkers.",
    economic_triggers: { unemployment_rate_min: 4.8 },
    choices: [
      {
        option_id: "A",
        label: "Condition Federal EV Incentives on Union Retraining Guarantees",
        description: "Bar any automaker from receiving federal consumer subsidies unless displaced workers are retained.",
        political_effects: { district_approval: 10, national_approval: 8, party_loyalty: 8, war_chest: 2.0, political_capital: 10 },
        economic_effects: { unemployment_rate: -0.20, real_wage_growth: 0.20 }
      },
      {
        option_id: "B",
        label: "Enact an 'Automation Replacement Tax' on Robotic Equipment",
        description: "Levy an annual severance surcharge on automated machinery replacing human assembly workers.",
        political_effects: { district_approval: 7, national_approval: 6, party_loyalty: 5, war_chest: -3.5, political_capital: 7 },
        economic_effects: { gdp_growth: -0.20, fiscal_deficit: -0.15 }
      },
      {
        option_id: "C",
        label: "Create Trade Adjustment Education Stipends & Relocation Grants",
        description: "Provide $15,000 relocation and trade school scholarships for laid-off families.",
        political_effects: { district_approval: 7, national_approval: 7, party_loyalty: 6, war_chest: 2.5, political_capital: 6 },
        economic_effects: { unemployment_rate: -0.15, fiscal_deficit: 0.15 }
      }
    ]
  },
  {
    id: "POL-NEG-14",
    name: "National Rail Freight Strike & Chemical Supply Gridlock",
    polarity: "Negative",
    category: "Labor & Supply Chains",
    impact_min: 72,
    impact_max: 92,
    impact_tier: "Transformative",
    summary: "Railroad unions walk off the job over grueling scheduling and sick leave disputes, threatening water purification chemicals and coal deliveries.",
    economic_triggers: { inflation_cpi_min: 3.0, real_wage_growth_max: 0 },
    choices: [
      {
        option_id: "A",
        label: "Pass Emergency Congressional Statute Imposing Paid Sick Days",
        description: "Force the multi-billion-dollar railroad conglomerates to grant 7 paid sick days as demanded by unions.",
        political_effects: { district_approval: 9, national_approval: 9, party_loyalty: 7, war_chest: 1.0, political_capital: 12 },
        economic_effects: { flexible_cpi: -0.30, real_wage_growth: 0.20, consumer_confidence: 6 }
      },
      {
        option_id: "B",
        label: "Order Strikers Immediately Back to Work under Railway Labor Act",
        description: "Prioritize uninterrupted national economic logistics, ending the strike without meeting labor demands.",
        political_effects: { district_approval: -8, national_approval: 4, party_loyalty: 6, war_chest: 5.5, political_capital: -4 },
        economic_effects: { gdp_growth: 0.15, flexible_cpi: -0.15 }
      },
      {
        option_id: "C",
        label: "Establish 24/7 Federal Mediation with Government Expense Offsets",
        description: "Keep both sides locked in a room and cover railroad temporary relief sick-day costs with public subsidies.",
        political_effects: { district_approval: 6, national_approval: 7, party_loyalty: 6, war_chest: 3.0, political_capital: 6 },
        economic_effects: { fiscal_deficit: 0.15, flexible_cpi: -0.20 }
      }
    ]
  },
  {
    id: "POL-NEG-15",
    name: "Severe River Flooding & Disaster Relief Agency Insolvency",
    polarity: "Negative",
    category: "Natural Disaster & Fiscal",
    impact_min: 68,
    impact_max: 88,
    impact_tier: "Major",
    summary: "Catastrophic atmospheric river dumps 18 inches of rain across three agricultural river valleys, exhausting federal disaster agency funds.",
    economic_triggers: { fiscal_deficit_min: 4.5 },
    choices: [
      {
        option_id: "A",
        label: "Authorise Emergency $25B Supplemental Disaster Appropriation",
        description: "Pass emergency funding immediately without demanding budget spending cuts elsewhere.",
        political_effects: { district_approval: 12, national_approval: 8, party_loyalty: 6, war_chest: 2.0, political_capital: 8 },
        economic_effects: { fiscal_deficit: 0.35, consumer_confidence: 5, gdp_growth: 0.15 }
      },
      {
        option_id: "B",
        label: "Demand Emergency Aid Be Fully Offset by Unspent Foreign Aid",
        description: "Satisfy fiscal conservatives by rescinding overseas climate and multilateral loans to fund domestic rebuilding.",
        political_effects: { district_approval: 7, national_approval: 6, party_loyalty: 8, war_chest: 3.5, political_capital: 6 },
        economic_effects: { fiscal_deficit: 0.0, international_standing: -6 }
      },
      {
        option_id: "C",
        label: "Overhaul National Flood Insurance Program with Risk-Based Premiums",
        description: "Stop rebuilding vulnerable floodplains repeatedly, requiring coastal and river properties to pay true actuarial costs.",
        political_effects: { district_approval: -5, national_approval: 7, party_loyalty: 6, war_chest: 2.5, political_capital: 10 },
        economic_effects: { fiscal_deficit: -0.20, housing_cost_index: -1.0 }
      }
    ]
  },
  {
    id: "POL-NEG-16",
    name: "Hostile Redistricting & Partisan Gerrymandering Lawsuits",
    polarity: "Negative",
    category: "Electoral & Legal",
    impact_min: 55,
    impact_max: 75,
    impact_tier: "Moderate",
    summary: "Judicial rulings strike down state legislative district maps, radically reshaping your voter demographics 10 months before election day.",
    economic_triggers: { months_to_election_max: 14 },
    choices: [
      {
        option_id: "A",
        label: "Launch Aggressive Grassroots Outreach in Newly Added Precincts",
        description: "Spend evenings knocking doors, meeting civic associations, and listening to newly absorbed constituents.",
        political_effects: { district_approval: 9, national_approval: 3, party_loyalty: 5, war_chest: -3.0, political_capital: 6 },
        economic_effects: { consumer_confidence: 2 }
      },
      {
        option_id: "B",
        label: "Appeal the Map to the Supreme Court & Seek Emergency Injunction",
        description: "Retain top constitutional litigators to tie the new lines in court until after the upcoming election.",
        political_effects: { district_approval: 2, national_approval: 4, party_loyalty: 7, war_chest: -2.0, political_capital: 4 },
        economic_effects: { legal_certainty: 4 }
      },
      {
        option_id: "C",
        label: "Co-Sponsor Independent Bipartisan Redistricting Commission Statute",
        description: "Take the high road and establish non-partisan citizen panels to draw all future maps.",
        political_effects: { district_approval: 6, national_approval: 10, party_loyalty: -6, war_chest: 1.0, political_capital: 12 },
        economic_effects: { parliamentary_approval: 8 }
      }
    ]
  },
  {
    id: "POL-NEG-17",
    name: "Classified Defense Intelligence Leak on Foreign Surveillance",
    polarity: "Negative",
    category: "National Security & Privacy",
    impact_min: 65,
    impact_max: 85,
    impact_tier: "Major",
    summary: "Whistleblower documents reveal federal intelligence agencies intercepted domestic emails and phone metadata without court warrants.",
    economic_triggers: { national_approval_max: 52 },
    choices: [
      {
        option_id: "A",
        label: "Lead Congressional Subpoenas into Intelligence Overreach",
        description: "Call agency directors to testify under oath and demand severe criminal penalties for warrantless surveillance.",
        political_effects: { district_approval: 8, national_approval: 11, party_loyalty: -4, war_chest: 1.5, political_capital: 14 },
        economic_effects: { parliamentary_approval: 8 }
      },
      {
        option_id: "B",
        label: "Defend Intelligence Agencies and Focus on Tracking the Leaker",
        description: "Emphasize counter-terrorism necessities and urge rapid extradition of the fugitive leaker.",
        political_effects: { district_approval: -4, national_approval: 4, party_loyalty: 8, war_chest: 4.0, political_capital: 4 },
        economic_effects: { national_security: 8 }
      },
      {
        option_id: "C",
        label: "Author the Digital Fourth Amendment Civil Liberties Bill",
        description: "Require judicial warrants for all domestic data broker purchases and cloud communication seizures.",
        political_effects: { district_approval: 7, national_approval: 10, party_loyalty: 5, war_chest: -1.0, political_capital: 12 },
        economic_effects: { tech_market: -10 }
      }
    ]
  },
  {
    id: "POL-NEG-18",
    name: "Public Pension Fund Solvency Shortfall & Taxpayer Bailout Demand",
    polarity: "Negative",
    category: "Pensions & Municipal Solvency",
    impact_min: 70,
    impact_max: 90,
    impact_tier: "Major",
    summary: "Unrealistic 8% return assumptions and aging demographics leave municipal teachers and firefighter retirement systems with an $80B hole.",
    economic_triggers: { bond_yield_10y_min: 4.2 },
    choices: [
      {
        option_id: "A",
        label: "Authorize Emergency Federal Pension Solvency Guarantee",
        description: "Guarantee public worker pension checks in full to protect retirees from catastrophic benefit cuts.",
        political_effects: { district_approval: 10, national_approval: 5, party_loyalty: 7, war_chest: 4.0, political_capital: 6 },
        economic_effects: { fiscal_deficit: 0.40, bond_yield_10y: 0.15 }
      },
      {
        option_id: "B",
        label: "Mandate Structural Pension Reforms & Raised Retirement Ages",
        description: "Require retirement systems to raise retirement age by 2 years and transition new hires to hybrid 401(k) accounts.",
        political_effects: { district_approval: -7, national_approval: 8, party_loyalty: 6, war_chest: 3.5, political_capital: 12 },
        economic_effects: { fiscal_deficit: -0.30, bond_yield_10y: -0.20 }
      },
      {
        option_id: "C",
        label: "Fund Deficit via State Lottery & High-Frequency Trading Tax",
        description: "Enact a 0.05% financial transaction fee on Wall Street algorithmic flash trading dedicated to pensions.",
        political_effects: { district_approval: 8, national_approval: 8, party_loyalty: 6, war_chest: -3.5, political_capital: 10 },
        economic_effects: { stock_market_index: -50, fiscal_deficit: -0.25 }
      }
    ]
  },
  {
    id: "POL-NEG-19",
    name: "Regional Banking Contagion & Depositor Flight Panic",
    polarity: "Negative",
    category: "Banking & Financial Stability",
    impact_min: 78,
    impact_max: 98,
    impact_tier: "Transformative",
    summary: "Social media rumors trigger a 36-hour $40B digital deposit run on two mid-tier commercial lenders, forcing emergency FDIC/central bank backstops.",
    economic_triggers: { interest_rate_min: 4.2, bank_lending_rate_min: 6.2 },
    choices: [
      {
        option_id: "A",
        label: "Guarantee 100% of All Business Operating Deposits",
        description: "Backstop uninsured payroll deposits to prevent immediate payroll checks from bouncing nationwide.",
        political_effects: { district_approval: 5, national_approval: 7, party_loyalty: 7, war_chest: 4.5, political_capital: 8 },
        economic_effects: { consumer_confidence: 6, bank_lending_rate: -0.25, moral_hazard: 15 }
      },
      {
        option_id: "B",
        label: "Enforce Executive Pay Clawbacks & Wipe Out Bank Shareholders",
        description: "Ensure bank directors receive zero taxpayer parachutes and face comprehensive criminal negligence audits.",
        political_effects: { district_approval: 10, national_approval: 11, party_loyalty: 6, war_chest: -3.0, political_capital: 14 },
        economic_effects: { stock_market_index: -40, public_confidence: 8 }
      },
      {
        option_id: "C",
        label: "Reinstate Stricter Dodd-Frank Tier-2 Capital Reserve Requirements",
        description: "Roll back deregulatory exemptions and require mid-size banks to hold 14% Tier-1 common equity cushions.",
        political_effects: { district_approval: 7, national_approval: 8, party_loyalty: 7, war_chest: -2.5, political_capital: 10 },
        economic_effects: { bank_lending_rate: 0.15, stability: 12 }
      }
    ]
  },
  {
    id: "POL-NEG-20",
    name: "Youth Unemployment Surge & Student Debt Boycott Movement",
    polarity: "Negative",
    category: "Youth & Higher Education",
    impact_min: 60,
    impact_max: 80,
    impact_tier: "Moderate",
    summary: "Recent college graduates face entry-level hiring freezes, sparking nationwide debt strikes and campus marches outside parliament.",
    economic_triggers: { unemployment_rate_min: 5.0, consumer_confidence_max: 72 },
    choices: [
      {
        option_id: "A",
        label: "Enact Income-Driven Loan Forgiveness Capped at 5% of Earnings",
        description: "Cap monthly debt payments at 5% of discretionary income and forgive balances after 10 years of payments.",
        political_effects: { district_approval: 8, national_approval: 7, party_loyalty: 7, war_chest: 1.5, political_capital: 8 },
        economic_effects: { consumer_confidence: 7, poverty_discontent: -4.0, fiscal_deficit: 0.30 }
      },
      {
        option_id: "B",
        label: "Require Universities with Large Endowments to Co-Sign Student Debt",
        description: "Hold colleges financially responsible for defaults if their graduates fail to secure living-wage careers.",
        political_effects: { district_approval: 6, national_approval: 9, party_loyalty: 7, war_chest: 2.0, political_capital: 10 },
        economic_effects: { fiscal_deficit: -0.15 }
      },
      {
        option_id: "C",
        label: "Create National Civilian Conservation & Tech Service Corps",
        description: "Offer two-year public service appointments with full tuition reimbursement upon completion.",
        political_effects: { district_approval: 9, national_approval: 8, party_loyalty: 8, war_chest: 2.5, political_capital: 9 },
        economic_effects: { unemployment_rate: -0.30, gdp_growth: 0.15 }
      }
    ]
  },
  {
    id: "POL-NEG-21",
    name: "Violent Crime Escalation & Metropolitan Police Attrition",
    polarity: "Negative",
    category: "Public Safety & Law",
    impact_min: 65,
    impact_max: 85,
    impact_tier: "Major",
    summary: "Downtown retail smash-and-grab robberies and high police retirement rates lead to merchant warnings and evening curfews.",
    economic_triggers: { poverty_discontent_min: 35 },
    choices: [
      {
        option_id: "A",
        label: "Authorize Federal Law Enforcement Grants for Hiring & Retention",
        description: "Deploy $5B in federal grants for officer recruitment bonuses and body-camera accountability.",
        political_effects: { district_approval: 10, national_approval: 8, party_loyalty: 8, war_chest: 4.0, political_capital: 8 },
        economic_effects: { consumer_confidence: 6, fiscal_deficit: 0.15 }
      },
      {
        option_id: "B",
        label: "Pass Organized Retail Crime Federal Felonies Statute",
        description: "Upgrade coordinated multi-store theft rings to federal racketeering offenses with mandatory prison terms.",
        political_effects: { district_approval: 8, national_approval: 8, party_loyalty: 8, war_chest: 3.5, political_capital: 7 },
        economic_effects: { consumer_confidence: 5, retail_growth: 0.15 }
      },
      {
        option_id: "C",
        label: "Fund Mental Health & Addiction Crisis Intervention Centers",
        description: "Address the root causes of urban vagrancy by establishing diversionary rehabilitation facilities.",
        political_effects: { district_approval: 6, national_approval: 7, party_loyalty: 5, war_chest: 1.0, political_capital: 9 },
        economic_effects: { poverty_discontent: -5.0, healthcare_costs: -0.10 }
      }
    ]
  },
  {
    id: "POL-NEG-22",
    name: "Critical Antibiotic & Pediatric Medicine National Shortage",
    polarity: "Negative",
    category: "Public Health & Supply Chains",
    impact_min: 65,
    impact_max: 85,
    impact_tier: "Major",
    summary: "Overseas manufacturing plant contamination shuts off supplies of liquid amoxicillin, chemotherapy vials, and pediatric pain relievers.",
    economic_triggers: { flexible_cpi_min: 3.2 },
    choices: [
      {
        option_id: "A",
        label: "Invoke Defense Production Act for Domestic Critical Medicine Plants",
        description: "Commandeer domestic bio-reactors to formulate generic pediatric antibiotics immediately.",
        political_effects: { district_approval: 11, national_approval: 10, party_loyalty: 7, war_chest: 2.0, political_capital: 12 },
        economic_effects: { consumer_confidence: 6, flexible_cpi: -0.20 }
      },
      {
        option_id: "B",
        label: "Permit Emergency Fast-Track Imports from Allied Drug Regulators",
        description: "Allow certified medicine shipments from Canada, Europe, and Japan without domestic re-testing delays.",
        political_effects: { district_approval: 7, national_approval: 7, party_loyalty: 6, war_chest: 3.0, political_capital: 8 },
        economic_effects: { flexible_cpi: -0.30 }
      },
      {
        option_id: "C",
        label: "Establish National Strategic Pharmaceutical Reserve",
        description: "Fund permanent temperature-controlled underground stockpiles of the top 200 essential life-saving molecules.",
        political_effects: { district_approval: 8, national_approval: 8, party_loyalty: 7, war_chest: 2.5, political_capital: 9 },
        economic_effects: { fiscal_deficit: 0.20 }
      }
    ]
  },
  {
    id: "POL-NEG-23",
    name: "Extreme Winter Polar Vortex & Natural Gas Pipeline Freezes",
    polarity: "Negative",
    category: "Weather & Energy Crisis",
    impact_min: 60,
    impact_max: 80,
    impact_tier: "Moderate",
    summary: "Sub-zero Arctic blast freezes wellhead natural gas flow, pushing spot electricity prices up 800% and threatening home heating stability.",
    economic_triggers: { flexible_cpi_min: 2.8 },
    choices: [
      {
        option_id: "A",
        label: "Cap Residential Wholesale Electric Rates & Subsidize Utilities",
        description: "Protect families from $1,500 monthly heating bills with emergency state winterization funds.",
        political_effects: { district_approval: 11, national_approval: 7, party_loyalty: 6, war_chest: 2.0, political_capital: 7 },
        economic_effects: { consumer_confidence: 5, fiscal_deficit: 0.30, flexible_cpi: -0.30 }
      },
      {
        option_id: "B",
        label: "Mandate Weatherization & Dual-Fuel Redundancy for All Power Plants",
        description: "Require power stations to install thermal insulation and maintain 30 days of backup heating fuel onsite.",
        political_effects: { district_approval: 7, national_approval: 8, party_loyalty: 7, war_chest: -2.0, political_capital: 10 },
        economic_effects: { gdp_growth: 0.10, electricity_rates: 0.10 }
      },
      {
        option_id: "C",
        label: "Invest in Distributed Community Micro-Grids and Battery Banks",
        description: "Deploy modular neighborhood battery packs to ensure heating warming centers remain powered.",
        political_effects: { district_approval: 8, national_approval: 8, party_loyalty: 7, war_chest: 2.5, political_capital: 8 },
        economic_effects: { gdp_growth: 0.20, fiscal_deficit: 0.15 }
      }
    ]
  },
  {
    id: "POL-NEG-24",
    name: "Government Fiscal Impasse & Non-Essential Federal Shutdown",
    polarity: "Negative",
    category: "Government Operations & Crisis",
    impact_min: 78,
    impact_max: 98,
    impact_tier: "Transformative",
    summary: "Failure to pass appropriations bills shutters national parks, furloughs 800,000 public employees, and halts small business loan approvals.",
    economic_triggers: { fiscal_deficit_min: 5.5, parliamentary_approval_max: 42 },
    choices: [
      {
        option_id: "A",
        label: "Refuse Salary & Host Teledrive with Furloughed Federal Workers",
        description: "Donate your personal legislative salary to local food banks and hold daily press briefings on the shutdown cost.",
        political_effects: { district_approval: 9, national_approval: 10, party_loyalty: -3, war_chest: -1.0, political_capital: 10 },
        economic_effects: { parliamentary_approval: 6 }
      },
      {
        option_id: "B",
        label: "Pass Short-Term Continuing Resolution (CR) with Spending Cuts",
        description: "Compromise on a 60-day stopgap funding measure with 1.5% across-the-board spending clawbacks.",
        political_effects: { district_approval: 5, national_approval: 7, party_loyalty: -6, war_chest: 3.0, political_capital: 12 },
        economic_effects: { gdp_growth: 0.10, fiscal_deficit: -0.15 }
      },
      {
        option_id: "C",
        label: "Pass Permanent 'No Budget, No Recess' Automatic Funding Statute",
        description: "Legislate that if appropriations lapse, funding automatically renews at current levels and politicians are barred from recess.",
        political_effects: { district_approval: 10, national_approval: 12, party_loyalty: -5, war_chest: 1.0, political_capital: 16 },
        economic_effects: { parliamentary_approval: 14, fiscal_certainty: 10 }
      }
    ]
  },
  {
    id: "POL-NEG-25",
    name: "Ruling Coalition Fracturing & Threat of No-Confidence Vote",
    polarity: "Negative",
    category: "Party Politics & Governance",
    impact_min: 80,
    impact_max: 98,
    impact_tier: "Transformative",
    summary: "Factional revolt among backbench rebels and minority coalition partners threatens a motion of no confidence and snap parliamentary elections.",
    economic_triggers: { party_loyalty_max: 50 },
    choices: [
      {
        option_id: "A",
        label: "Offer Key Ministerial Portfolios to Rebel Faction Leaders",
        description: "Surrender Cabinet positions to dissident faction chiefs to lock in their floor votes and save the government.",
        political_effects: { district_approval: -4, national_approval: -2, party_loyalty: 14, war_chest: 2.0, political_capital: -12 },
        economic_effects: { political_stability: 8 }
      },
      {
        option_id: "B",
        label: "Call Their Bluff & Threaten Snap General Elections",
        description: "Warn the rebels that a fallen government will trigger immediate snap elections that could cost them their seats.",
        political_effects: { district_approval: 6, national_approval: 7, party_loyalty: -8, war_chest: 1.0, political_capital: 14 },
        economic_effects: { political_stability: -5 }
      },
      {
        option_id: "C",
        label: "Broker Comprehensive Cross-Chamber Policy Accord",
        description: "Draft a binding 10-point policy charter addressing rebel grievances on regional development and tax equity.",
        political_effects: { district_approval: 8, national_approval: 9, party_loyalty: 10, war_chest: 3.0, political_capital: 16 },
        economic_effects: { parliamentary_approval: 10, political_stability: 12 }
      }
    ]
  }
];

const fullWeb = {
  title: "Political Simulator: Web of Statecraft Events & Backwards-Planned Causal Graph",
  version: "1.0",
  metadata: {
    total_events: 50,
    positive_events: 25,
    negative_events: 25,
    total_choices: 150,
    impact_scale: "0 - 100",
    impact_tiers: {
      "Minor": "10-30",
      "Moderate": "31-60",
      "Major": "61-80",
      "Transformative": "81-100"
    }
  },
  events: [...POSITIVE_EVENTS, ...NEGATIVE_EVENTS]
};

// Write JSON files
const jsonOut = JSON.stringify(fullWeb, null, 2);
fs.writeFileSync(path.join(__dirname, '../political_event_web.json'), jsonOut, 'utf8');
fs.writeFileSync(path.join(__dirname, 'political_event_web.json'), jsonOut, 'utf8');

// Generate Markdown documentation
let md = `# Political Simulator: 50-Event Causal Web & Decision Tree\\n\\n`;
md += `This document details the complete 50-event causal web powering **Statecraft: The Political Simulator**, designed to run in parallel with or linked to Central Bank Bonanza.\\n\\n`;
md += `* **Total Events:** 50 (25 Positive, 25 Negative)\\n`;
md += `* **Total Decision Options:** 150 (3 strategic choices per event with political & macroeconomic trade-offs)\\n`;
md += `* **Linked Macro Telemetry:** Inflation (CPI), Unemployment, GDP Growth, Policy Interest Rate, Fiscal Deficit, Debt-to-GDP, Housing Cost, Consumer Confidence.\\n\\n`;

md += `## Positive Events (25)\\n\\n`;
for (const ev of POSITIVE_EVENTS) {
  md += `### ${ev.id}: ${ev.name}\\n`;
  md += `* **Category:** ${ev.category} | **Tier:** ${ev.impact_tier} (${ev.impact_min}-${ev.impact_max})\\n`;
  md += `* **Summary:** ${ev.summary}\\n`;
  md += `* **Strategic Choices:**\\n`;
  for (const c of ev.choices) {
    md += `  * **Option ${c.option_id} - ${c.label}:** ${c.description}\\n`;
  }
  md += `\\n`;
}

md += `## Negative Events (25)\\n\\n`;
for (const ev of NEGATIVE_EVENTS) {
  md += `### ${ev.id}: ${ev.name}\\n`;
  md += `* **Category:** ${ev.category} | **Tier:** ${ev.impact_tier} (${ev.impact_min}-${ev.impact_max})\\n`;
  md += `* **Summary:** ${ev.summary}\\n`;
  md += `* **Strategic Choices:**\\n`;
  for (const c of ev.choices) {
    md += `  * **Option ${c.option_id} - ${c.label}:** ${c.description}\\n`;
  }
  md += `\\n`;
}

fs.writeFileSync(path.join(__dirname, '../political_event_web.md'), md, 'utf8');
console.log("Successfully generated political_event_web.json and political_event_web.md with 50 events!");
