export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  exchange: string;
  /** Coverage flag — true when the stock has an in-force health score. When present,
   *  the typeahead shows a band/coverage chip; absent on legacy/static callers. */
  scored?: boolean;
  /** In-force band label (lower-cased union) when scored — drives the typeahead chip. */
  band?: string;
}

export const indianStocks: Stock[] = [
  // Technology
  { symbol: "TCS", name: "Tata Consultancy Services Ltd", sector: "Technology", exchange: "NSE" },
  { symbol: "INFY", name: "Infosys Ltd", sector: "Technology", exchange: "NSE" },
  { symbol: "WIPRO", name: "Wipro Ltd", sector: "Technology", exchange: "NSE" },
  { symbol: "HCLTECH", name: "HCL Technologies Ltd", sector: "Technology", exchange: "NSE" },
  { symbol: "TECHM", name: "Tech Mahindra Ltd", sector: "Technology", exchange: "NSE" },
  
  // Banking & Financial Services
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd", sector: "Banking", exchange: "NSE" },
  { symbol: "ICICIBANK", name: "ICICI Bank Ltd", sector: "Banking", exchange: "NSE" },
  { symbol: "SBIN", name: "State Bank of India", sector: "Banking", exchange: "NSE" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank Ltd", sector: "Banking", exchange: "NSE" },
  { symbol: "AXISBANK", name: "Axis Bank Ltd", sector: "Banking", exchange: "NSE" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance Ltd", sector: "Financial Services", exchange: "NSE" },
  { symbol: "HDFCLIFE", name: "HDFC Life Insurance Company Ltd", sector: "Financial Services", exchange: "NSE" },
  { symbol: "SBILIFE", name: "SBI Life Insurance Company Ltd", sector: "Financial Services", exchange: "NSE" },
  
  // Automotive
  { symbol: "MARUTI", name: "Maruti Suzuki India Ltd", sector: "Automotive", exchange: "NSE" },
  { symbol: "TATAMOTORS", name: "Tata Motors Ltd", sector: "Automotive", exchange: "NSE" },
  { symbol: "M&M", name: "Mahindra & Mahindra Ltd", sector: "Automotive", exchange: "NSE" },
  { symbol: "BAJAJ-AUTO", name: "Bajaj Auto Ltd", sector: "Automotive", exchange: "NSE" },
  { symbol: "HEROMOTOCO", name: "Hero MotoCorp Ltd", sector: "Automotive", exchange: "NSE" },
  { symbol: "EICHERMOT", name: "Eicher Motors Ltd", sector: "Automotive", exchange: "NSE" },
  
  // FMCG
  { symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd", sector: "FMCG", exchange: "NSE" },
  { symbol: "ITC", name: "ITC Ltd", sector: "FMCG", exchange: "NSE" },
  { symbol: "NESTLEIND", name: "Nestle India Ltd", sector: "FMCG", exchange: "NSE" },
  { symbol: "BRITANNIA", name: "Britannia Industries Ltd", sector: "FMCG", exchange: "NSE" },
  { symbol: "DABUR", name: "Dabur India Ltd", sector: "FMCG", exchange: "NSE" },
  { symbol: "GODREJCP", name: "Godrej Consumer Products Ltd", sector: "FMCG", exchange: "NSE" },
  
  // Energy & Power
  { symbol: "RELIANCE", name: "Reliance Industries Ltd", sector: "Energy", exchange: "NSE" },
  { symbol: "ONGC", name: "Oil and Natural Gas Corporation Ltd", sector: "Energy", exchange: "NSE" },
  { symbol: "POWERGRID", name: "Power Grid Corporation of India Ltd", sector: "Power", exchange: "NSE" },
  { symbol: "NTPC", name: "NTPC Ltd", sector: "Power", exchange: "NSE" },
  { symbol: "ADANIGREEN", name: "Adani Green Energy Ltd", sector: "Power", exchange: "NSE" },
  { symbol: "ADANIPOWER", name: "Adani Power Ltd", sector: "Power", exchange: "NSE" },
  { symbol: "BPCL", name: "Bharat Petroleum Corporation Ltd", sector: "Energy", exchange: "NSE" },
  { symbol: "IOC", name: "Indian Oil Corporation Ltd", sector: "Energy", exchange: "NSE" },
  
  // Pharmaceuticals
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical Industries Ltd", sector: "Pharmaceuticals", exchange: "NSE" },
  { symbol: "DRREDDY", name: "Dr. Reddy's Laboratories Ltd", sector: "Pharmaceuticals", exchange: "NSE" },
  { symbol: "CIPLA", name: "Cipla Ltd", sector: "Pharmaceuticals", exchange: "NSE" },
  { symbol: "DIVISLAB", name: "Divi's Laboratories Ltd", sector: "Pharmaceuticals", exchange: "NSE" },
  { symbol: "AUROPHARMA", name: "Aurobindo Pharma Ltd", sector: "Pharmaceuticals", exchange: "NSE" },
  { symbol: "BIOCON", name: "Biocon Ltd", sector: "Pharmaceuticals", exchange: "NSE" },
  
  // Telecom
  { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd", sector: "Telecom", exchange: "NSE" },
  { symbol: "IDEA", name: "Vodafone Idea Ltd", sector: "Telecom", exchange: "NSE" },
  
  // Metals & Mining
  { symbol: "TATASTEEL", name: "Tata Steel Ltd", sector: "Metals", exchange: "NSE" },
  { symbol: "HINDALCO", name: "Hindalco Industries Ltd", sector: "Metals", exchange: "NSE" },
  { symbol: "JSWSTEEL", name: "JSW Steel Ltd", sector: "Metals", exchange: "NSE" },
  { symbol: "VEDL", name: "Vedanta Ltd", sector: "Metals", exchange: "NSE" },
  { symbol: "COALINDIA", name: "Coal India Ltd", sector: "Mining", exchange: "NSE" },
  
  // Cement
  { symbol: "ULTRACEMCO", name: "UltraTech Cement Ltd", sector: "Cement", exchange: "NSE" },
  { symbol: "GRASIM", name: "Grasim Industries Ltd", sector: "Cement", exchange: "NSE" },
  { symbol: "SHREECEM", name: "Shree Cement Ltd", sector: "Cement", exchange: "NSE" },
  { symbol: "AMBUJACEM", name: "Ambuja Cements Ltd", sector: "Cement", exchange: "NSE" },
  
  // Construction & Real Estate
  { symbol: "LT", name: "Larsen & Toubro Ltd", sector: "Construction", exchange: "NSE" },
  { symbol: "DLF", name: "DLF Ltd", sector: "Real Estate", exchange: "NSE" },
  { symbol: "GODREJPROP", name: "Godrej Properties Ltd", sector: "Real Estate", exchange: "NSE" },
  
  // Consumer Durables
  { symbol: "TITAN", name: "Titan Company Ltd", sector: "Consumer Durables", exchange: "NSE" },
  { symbol: "ASIANPAINT", name: "Asian Paints Ltd", sector: "Consumer Durables", exchange: "NSE" },
  { symbol: "HAVELLS", name: "Havells India Ltd", sector: "Consumer Durables", exchange: "NSE" },
  { symbol: "VOLTAS", name: "Voltas Ltd", sector: "Consumer Durables", exchange: "NSE" },
  
  // Diversified
  { symbol: "ADANIENT", name: "Adani Enterprises Ltd", sector: "Diversified", exchange: "NSE" },
  { symbol: "ADANIPORTS", name: "Adani Ports and Special Economic Zone Ltd", sector: "Infrastructure", exchange: "NSE" },
  
  // Retail
  { symbol: "DMART", name: "Avenue Supermarts Ltd", sector: "Retail", exchange: "NSE" },
  { symbol: "TRENT", name: "Trent Ltd", sector: "Retail", exchange: "NSE" },
  
  // Media & Entertainment
  { symbol: "ZEEL", name: "Zee Entertainment Enterprises Ltd", sector: "Media", exchange: "NSE" },
  { symbol: "PVRINOX", name: "PVR INOX Ltd", sector: "Entertainment", exchange: "NSE" },
];

export interface Sector {
  id: string;
  name: string;
  description: string;
  stockCount: number;
}

export const indianSectors: Sector[] = [
  {
    id: "technology",
    name: "Technology",
    description: "IT Services & Software",
    stockCount: 5,
  },
  {
    id: "banking",
    name: "Banking",
    description: "Banks & Financial Institutions",
    stockCount: 5,
  },
  {
    id: "financial-services",
    name: "Financial Services",
    description: "Insurance & NBFC",
    stockCount: 3,
  },
  {
    id: "automotive",
    name: "Automotive",
    description: "Automobiles & Auto Components",
    stockCount: 6,
  },
  {
    id: "fmcg",
    name: "FMCG",
    description: "Fast Moving Consumer Goods",
    stockCount: 6,
  },
  {
    id: "energy",
    name: "Energy",
    description: "Oil & Natural Gas",
    stockCount: 4,
  },
  {
    id: "power",
    name: "Power",
    description: "Power Generation & Distribution",
    stockCount: 4,
  },
  {
    id: "pharmaceuticals",
    name: "Pharmaceuticals",
    description: "Pharma & Healthcare",
    stockCount: 6,
  },
  {
    id: "telecom",
    name: "Telecom",
    description: "Telecommunications",
    stockCount: 2,
  },
  {
    id: "metals",
    name: "Metals",
    description: "Steel & Metal Products",
    stockCount: 4,
  },
  {
    id: "cement",
    name: "Cement",
    description: "Cement & Building Materials",
    stockCount: 4,
  },
  {
    id: "construction",
    name: "Construction",
    description: "Infrastructure & Construction",
    stockCount: 1,
  },
  {
    id: "real-estate",
    name: "Real Estate",
    description: "Property Development",
    stockCount: 2,
  },
  {
    id: "consumer-durables",
    name: "Consumer Durables",
    description: "Consumer Electronics & Durables",
    stockCount: 4,
  },
  {
    id: "retail",
    name: "Retail",
    description: "Retail & E-commerce",
    stockCount: 2,
  },
];

