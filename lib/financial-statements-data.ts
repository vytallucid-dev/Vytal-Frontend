// Financial Statements mock data – structured like Screener.in

export interface QuarterlyRow {
  metric: string;
  expandable?: boolean;
  subItems?: { label: string; values: (number | null)[] }[];
  values: (number | string | null)[];
  isPercentage?: boolean;
  bold?: boolean;
}

export interface AnnualRow {
  metric: string;
  expandable?: boolean;
  subItems?: { label: string; values: (number | null)[] }[];
  values: (number | string | null)[];
  isPercentage?: boolean;
  bold?: boolean;
  isSectionHeader?: boolean;
  isTotal?: boolean;
}

export interface CAGRCard {
  title: string;
  rows: { label: string; value: string }[];
}

export interface FinancialStatements {
  consolidated: {
    quarterly: {
      periods: string[];
      rows: QuarterlyRow[];
    };
    profitLoss: {
      periods: string[];
      rows: AnnualRow[];
      cagrCards: CAGRCard[];
    };
    balanceSheet: {
      periods: string[];
      rows: AnnualRow[];
    };
    cashFlow: {
      periods: string[];
      rows: AnnualRow[];
    };
  };
  standalone: {
    quarterly: {
      periods: string[];
      rows: QuarterlyRow[];
    };
    profitLoss: {
      periods: string[];
      rows: AnnualRow[];
      cagrCards: CAGRCard[];
    };
    balanceSheet: {
      periods: string[];
      rows: AnnualRow[];
    };
    cashFlow: {
      periods: string[];
      rows: AnnualRow[];
    };
  };
}

export const defaultFinancialStatements: FinancialStatements = {
  consolidated: {
    quarterly: {
      periods: ["Mar 2026", "Dec 2025", "Sep 2025", "Jun 2025", "Mar 2025", "Dec 2024", "Sep 2024", "Jun 2024"],
      rows: [
        {
          metric: "Revenue",
          expandable: true,
          values: [87182, 87067, 86994, 87372, 86779, 85040, 83204, 81567],
          subItems: [
            { label: "Interest Income", values: [72450, 72300, 72100, 72500, 71800, 70500, 68900, 67400] },
            { label: "Fee & Commission", values: [8240, 8100, 7980, 8050, 7920, 7750, 7560, 7380] },
            { label: "Treasury Income", values: [6492, 6667, 6914, 6822, 7059, 6790, 6744, 6787] },
          ],
        },
        {
          metric: "Expenses",
          expandable: true,
          values: [44028, 54145, 45161, 64497, 47709, 41307, 42580, 43120],
          subItems: [
            { label: "Employee Costs", values: [12400, 12800, 12200, 12600, 12100, 11800, 11500, 11200] },
            { label: "Operating Expenses", values: [9800, 10200, 9600, 10000, 9500, 9200, 8900, 8700] },
            { label: "Provisions", values: [21828, 31145, 23361, 41897, 26109, 20307, 22181, 23220] },
          ],
        },
        { metric: "Operating Profit", values: [43154, 32922, 41833, 22875, 39070, 43733, 40624, 38447], bold: true },
        { metric: "OPM %", values: ["49%", "38%", "48%", "26%", "45%", "51%", "49%", "47%"], isPercentage: true },
        {
          metric: "Other Income",
          expandable: true,
          values: [29737, 39860, 31567, 45683, 33489, 27154, 28320, 26540],
          subItems: [
            { label: "Dividend Income", values: [5200, 4800, 5100, 4900, 5000, 4600, 4500, 4300] },
            { label: "Gain on Investments", values: [24537, 35060, 26467, 40783, 28489, 22554, 23820, 22240] },
          ],
        },
        { metric: "Depreciation", values: [0, 0, 0, 0, 0, 0, 0, 0] },
        { metric: "Interest", values: [45220, 45821, 46741, 47709, 46986, 46914, 47200, 47500] },
        { metric: "Profit Before Tax", values: [27672, 26961, 26659, 20850, 25573, 23973, 21744, 17487], bold: true },
        { metric: "Tax %", values: ["24%", "23%", "24%", "18%", "25%", "24%", "23%", "24%"], isPercentage: true },
        {
          metric: "Net Profit",
          expandable: true,
          values: [21074, 20691, 20364, 17090, 19285, 18340, 16800, 13250],
          bold: true,
          subItems: [
            { label: "PAT (Continuing Ops)", values: [21074, 20691, 20364, 17090, 19285, 18340, 16800, 13250] },
            { label: "Minority Interest", values: [0, 0, 0, 0, 0, 0, 0, 0] },
          ],
        },
        { metric: "EPS in Rs", values: [13.22, 12.87, 12.76, 10.60, 12.31, 11.54, 10.53, 8.29] },
      ],
    },
    profitLoss: {
      periods: ["Mar 2026", "Mar 2025", "Mar 2024", "Mar 2023", "Mar 2022", "Mar 2021", "Mar 2020", "Mar 2019"],
      rows: [
        {
          metric: "Revenue",
          expandable: true,
          values: [348615, 336367, 283649, 170754, 135936, 128552, 122189, 107675],
          subItems: [
            { label: "Interest Income", values: [289000, 279000, 235000, 141000, 112000, 106000, 101000, 89000] },
            { label: "Fee & Commission", values: [32215, 30867, 25649, 16254, 13436, 12252, 11589, 10275] },
            { label: "Treasury & Other", values: [27400, 26500, 23000, 13500, 10500, 10300, 9600, 8400] },
          ],
        },
        { metric: "Interest Expense", values: [185491, 183894, 154139, 77780, 58584, 59248, 59631, 55280] },
        {
          metric: "Expenses",
          expandable: true,
          values: [207830, 186974, 174196, 63042, 56557, 52457, 48270, 42106],
          subItems: [
            { label: "Employee Costs", values: [49600, 47200, 43600, 26400, 22800, 20600, 18900, 16500] },
            { label: "Operating Expenses", values: [38400, 36500, 33900, 20100, 17800, 16300, 15200, 13400] },
            { label: "Provisions & Contingencies", values: [119830, 103274, 96696, 16542, 15957, 15557, 14170, 12206] },
          ],
        },
        { metric: "Financing Profit", values: [-44706, -34501, -44685, 29932, 20795, 16848, 14288, 10289], bold: true },
        { metric: "Financing Margin %", values: ["-13%", "-10%", "-16%", "18%", "15%", "13%", "12%", "10%"], isPercentage: true },
        {
          metric: "Other Income",
          expandable: true,
          values: [146848, 134548, 124346, 33912, 31759, 27333, 25480, 22416],
          subItems: [
            { label: "Dividend & Investment Income", values: [126000, 115000, 106000, 28000, 26000, 22000, 20500, 17900] },
            { label: "Misc Other Income", values: [20848, 19548, 18346, 5912, 5759, 5333, 4980, 4516] },
          ],
        },
        { metric: "Depreciation", values: [0, 3805, 3092, 2345, 1681, 1385, 1180, 980] },
        { metric: "Profit Before Tax", values: [102141, 96242, 76569, 61498, 50873, 42796, 38588, 31725], bold: true },
        { metric: "Tax %", values: ["22%", "24%", "15%", "25%", "25%", "26%", "25%", "27%"], isPercentage: true },
        {
          metric: "Net Profit",
          expandable: true,
          values: [79219, 73440, 65446, 46149, 38151, 31857, 28941, 23148],
          bold: true,
          subItems: [
            { label: "PAT (Continuing Ops)", values: [79219, 73440, 65446, 46149, 38151, 31857, 28941, 23148] },
            { label: "Minority Interest", values: [0, 0, 0, 0, 0, 0, 0, 0] },
          ],
        },
        { metric: "EPS in Rs", values: [49.39, 46.26, 42.16, 41.22, 34.31, 28.87, 26.41, 21.01] },
        { metric: "Dividend Payout %", values: ["31%", "24%", "23%", "23%", "23%", "11%", "16%", "14%"], isPercentage: true },
      ],
      cagrCards: [
        {
          title: "Compounded Sales Growth",
          rows: [
            { label: "10 Years", value: "19%" },
            { label: "5 Years", value: "22%" },
            { label: "3 Years", value: "27%" },
            { label: "TTM", value: "4%" },
          ],
        },
        {
          title: "Compounded Profit Growth",
          rows: [
            { label: "10 Years", value: "20%" },
            { label: "5 Years", value: "19%" },
            { label: "3 Years", value: "18%" },
            { label: "TTM", value: "8%" },
          ],
        },
        {
          title: "Stock Price CAGR",
          rows: [
            { label: "10 Years", value: "11%" },
            { label: "5 Years", value: "1%" },
            { label: "3 Years", value: "-2%" },
            { label: "1 Year", value: "7%" },
          ],
        },
        {
          title: "Return on Equity",
          rows: [
            { label: "10 Years", value: "16%" },
            { label: "5 Years", value: "15%" },
            { label: "3 Years", value: "15%" },
            { label: "Last Year", value: "16%" },
          ],
        },
      ],
    },
    balanceSheet: {
      periods: ["Mar 2026", "Mar 2025", "Mar 2024", "Mar 2023", "Mar 2022", "Mar 2021", "Mar 2020", "Mar 2019"],
      rows: [
        { metric: "LIABILITIES", values: [null, null, null, null, null, null, null, null], isSectionHeader: true },
        { metric: "Equity Capital", values: [1539, 765, 760, 558, 555, 551, 548, 545] },
        { metric: "Reserves", values: [579975, 521024, 455636, 288880, 246772, 209259, 183280, 161540] },
        { metric: "Borrowings", values: [588485, 634606, 730615, 256549, 226966, 177697, 155820, 132440] },
        {
          metric: "Other Liabilities",
          expandable: true,
          values: [628404, 524817, 466296, 101783, 90639, 78279, 68430, 58290],
          subItems: [
            { label: "Deposits", values: [3500000, 3200000, 2800000, 1800000, 1500000, 1270000, 1100000, 950000] },
            { label: "Other Liabilities", values: [628404, 524817, 466296, 101783, 90639, 78279, 68430, 58290] },
          ],
        },
        { metric: "Total Liabilities", values: [4908041, 4392110, 4030194, 2530432, 2122934, 1799507, 1562400, 1340000], bold: true, isTotal: true },
        { metric: "ASSETS", values: [null, null, null, null, null, null, null, null], isSectionHeader: true },
        { metric: "Net Block", expandable: true, values: [16492, 15258, 12604, 8431, 6432, 5248, 4580, 3920], subItems: [{ label: "Gross Block", values: [22500, 20800, 17200, 11500, 8800, 7200, 6300, 5400] }, { label: "Accumulated Depreciation", values: [6008, 5542, 4596, 3069, 2368, 1952, 1720, 1480] }] },
        { metric: "Capital WIP", values: [0, 0, 0, 0, 0, 0, 0, 0] },
        { metric: "Investments", values: [1280216, 1186473, 1005682, 511582, 449264, 438823, 395600, 354200] },
        {
          metric: "Other Assets",
          expandable: true,
          values: [3611333, 3190379, 3011909, 2010419, 1667238, 1355435, 1162220, 981880],
          subItems: [
            { label: "Loans & Advances", values: [3200000, 2820000, 2650000, 1760000, 1450000, 1180000, 1010000, 855000] },
            { label: "Cash & Bank Balances", values: [260333, 230379, 240909, 160419, 137238, 115435, 98220, 83880] },
            { label: "Other Assets", values: [151000, 140000, 121000, 90000, 80000, 60000, 54000, 43000] },
          ],
        },
        { metric: "Total Assets", values: [4908041, 4392110, 4030194, 2530432, 2122934, 1799507, 1562400, 1340000], bold: true, isTotal: true },
      ],
    },
    cashFlow: {
      periods: ["Mar 2026", "Mar 2025", "Mar 2024", "Mar 2023", "Mar 2022", "Mar 2021", "Mar 2020", "Mar 2019"],
      rows: [
        {
          metric: "Cash from Operating",
          expandable: true,
          values: [113506, 127242, 19069, 20814, -11960, 42476, 38200, 31400],
          subItems: [
            { label: "Net Profit", values: [79219, 73440, 65446, 46149, 38151, 31857, 28941, 23148] },
            { label: "Adjustments", values: [34287, 53802, -46377, -25335, -50111, 10619, 9259, 8252] },
          ],
        },
        {
          metric: "Cash from Investing",
          expandable: true,
          values: [6363, -3651, 16600, -2992, -2051, -1823, -1650, -1420],
          subItems: [
            { label: "Capex", values: [-3362, -3975, -3322, -2624, -1885, -1680, -1580, -1240] },
            { label: "Investment Purchases/Sales", values: [9725, 324, 19922, -368, -166, -143, -70, -180] },
          ],
        },
        {
          metric: "Cash from Financing",
          expandable: true,
          values: [-59005, -102478, -3983, 23941, 48124, -7321, -4200, -3800],
          subItems: [
            { label: "Debt Raised/(Repaid)", values: [-46121, -97873, 474476, -26417, 49209, -5936, -2800, -2900] },
            { label: "Dividends Paid", values: [-12884, -4605, -3983, -3824, -1085, -1385, -1400, -900] },
          ],
        },
        { metric: "Net Cash Flow", values: [60864, 21113, 31687, 41762, 34113, 33332, 32350, 26180], bold: true, isTotal: true },
        { metric: "Free Cash Flow", values: [110144, 123267, 14882, 17390, -14176, 40796, 36620, 30160], bold: true },
        { metric: "CFO/OP %", values: ["97%", "98%", "38%", "35%", "4%", "73%", "68%", "61%"], isPercentage: true },
      ],
    },
  },

  // Standalone – slightly different numbers
  standalone: {
    quarterly: {
      periods: ["Mar 2026", "Dec 2025", "Sep 2025", "Jun 2025", "Mar 2025", "Dec 2024", "Sep 2024", "Jun 2024"],
      rows: [
        {
          metric: "Revenue",
          expandable: true,
          values: [74820, 74610, 74500, 74800, 74200, 72850, 71200, 69700],
          subItems: [
            { label: "Interest Income", values: [63000, 62800, 62400, 63100, 62300, 61000, 59500, 58200] },
            { label: "Fee & Commission", values: [7020, 6910, 6800, 6900, 6700, 6650, 6500, 6300] },
            { label: "Treasury Income", values: [4800, 4900, 5300, 4800, 5200, 5200, 5200, 5200] },
          ],
        },
        {
          metric: "Expenses",
          expandable: true,
          values: [37700, 46400, 38700, 55200, 40900, 35400, 36500, 36900],
          subItems: [
            { label: "Employee Costs", values: [10600, 10900, 10400, 10800, 10300, 10100, 9800, 9500] },
            { label: "Operating Expenses", values: [8400, 8700, 8200, 8600, 8100, 7900, 7600, 7400] },
            { label: "Provisions", values: [18700, 26800, 20100, 35800, 22500, 17400, 19100, 20000] },
          ],
        },
        { metric: "Operating Profit", values: [37120, 28210, 35800, 19600, 33300, 37450, 34700, 32800], bold: true },
        { metric: "OPM %", values: ["50%", "38%", "48%", "26%", "45%", "51%", "49%", "47%"], isPercentage: true },
        {
          metric: "Other Income",
          expandable: true,
          values: [25470, 34150, 27050, 39150, 28700, 23260, 24270, 22730],
          subItems: [
            { label: "Dividend Income", values: [4450, 4100, 4360, 4200, 4290, 3950, 3860, 3680] },
            { label: "Gain on Investments", values: [21020, 30050, 22690, 34950, 24410, 19310, 20410, 19050] },
          ],
        },
        { metric: "Depreciation", values: [0, 0, 0, 0, 0, 0, 0, 0] },
        { metric: "Interest", values: [38740, 39260, 40060, 40880, 40250, 40180, 40450, 40700] },
        { metric: "Profit Before Tax", values: [23850, 23100, 22790, 17870, 21750, 20530, 18520, 14830], bold: true },
        { metric: "Tax %", values: ["24%", "23%", "24%", "18%", "25%", "24%", "23%", "24%"], isPercentage: true },
        {
          metric: "Net Profit",
          expandable: true,
          values: [18130, 17820, 17360, 14650, 16320, 15610, 14280, 11270],
          bold: true,
          subItems: [
            { label: "PAT (Continuing Ops)", values: [18130, 17820, 17360, 14650, 16320, 15610, 14280, 11270] },
          ],
        },
        { metric: "EPS in Rs", values: [11.38, 11.08, 10.88, 9.09, 10.41, 9.83, 8.96, 7.07] },
      ],
    },
    profitLoss: {
      periods: ["Mar 2026", "Mar 2025", "Mar 2024", "Mar 2023", "Mar 2022", "Mar 2021", "Mar 2020", "Mar 2019"],
      rows: [
        {
          metric: "Revenue",
          expandable: true,
          values: [298960, 288400, 243100, 146200, 116200, 110000, 104500, 92000],
          subItems: [
            { label: "Interest Income", values: [247600, 239300, 201600, 121000, 96000, 90800, 86400, 76100] },
            { label: "Fee & Commission", values: [27560, 26500, 22000, 13900, 11500, 10400, 9900, 8800] },
            { label: "Treasury & Other", values: [23800, 22600, 19500, 11300, 8700, 8800, 8200, 7100] },
          ],
        },
        { metric: "Interest Expense", values: [158800, 157600, 132000, 66700, 50200, 50800, 51100, 47300] },
        {
          metric: "Expenses",
          expandable: true,
          values: [178100, 160300, 149300, 54000, 48400, 44900, 41300, 36000],
          subItems: [
            { label: "Employee Costs", values: [42500, 40400, 37300, 22600, 19500, 17600, 16200, 14100] },
            { label: "Operating Expenses", values: [32900, 31300, 29000, 17200, 15200, 13900, 13000, 11400] },
            { label: "Provisions & Contingencies", values: [102700, 88600, 83000, 14200, 13700, 13400, 12100, 10500] },
          ],
        },
        { metric: "Financing Profit", values: [-37940, -29500, -38200, 25500, 17600, 14300, 12100, 8700], bold: true },
        { metric: "Financing Margin %", values: ["-13%", "-10%", "-16%", "17%", "15%", "13%", "12%", "9%"], isPercentage: true },
        {
          metric: "Other Income",
          expandable: true,
          values: [125880, 115400, 106600, 29100, 27200, 23400, 21800, 19200],
          subItems: [
            { label: "Dividend & Investment Income", values: [108000, 98600, 90900, 24000, 22300, 18900, 17600, 15300] },
            { label: "Misc Other Income", values: [17880, 16800, 15700, 5100, 4900, 4500, 4200, 3900] },
          ],
        },
        { metric: "Depreciation", values: [0, 3260, 2650, 2010, 1440, 1190, 1010, 840] },
        { metric: "Profit Before Tax", values: [87940, 82640, 65750, 52590, 43360, 36510, 32890, 27060], bold: true },
        { metric: "Tax %", values: ["22%", "24%", "15%", "25%", "25%", "26%", "25%", "27%"], isPercentage: true },
        {
          metric: "Net Profit",
          expandable: true,
          values: [68350, 63040, 56000, 39440, 32520, 27020, 24670, 19760],
          bold: true,
          subItems: [
            { label: "PAT (Continuing Ops)", values: [68350, 63040, 56000, 39440, 32520, 27020, 24670, 19760] },
          ],
        },
        { metric: "EPS in Rs", values: [42.63, 39.67, 36.10, 35.23, 29.27, 24.52, 22.50, 18.00] },
        { metric: "Dividend Payout %", values: ["31%", "24%", "23%", "23%", "23%", "11%", "16%", "14%"], isPercentage: true },
      ],
      cagrCards: [
        {
          title: "Compounded Sales Growth",
          rows: [
            { label: "10 Years", value: "18%" },
            { label: "5 Years", value: "21%" },
            { label: "3 Years", value: "26%" },
            { label: "TTM", value: "4%" },
          ],
        },
        {
          title: "Compounded Profit Growth",
          rows: [
            { label: "10 Years", value: "19%" },
            { label: "5 Years", value: "18%" },
            { label: "3 Years", value: "17%" },
            { label: "TTM", value: "8%" },
          ],
        },
        {
          title: "Stock Price CAGR",
          rows: [
            { label: "10 Years", value: "11%" },
            { label: "5 Years", value: "1%" },
            { label: "3 Years", value: "-2%" },
            { label: "1 Year", value: "7%" },
          ],
        },
        {
          title: "Return on Equity",
          rows: [
            { label: "10 Years", value: "15%" },
            { label: "5 Years", value: "14%" },
            { label: "3 Years", value: "14%" },
            { label: "Last Year", value: "15%" },
          ],
        },
      ],
    },
    balanceSheet: {
      periods: ["Mar 2026", "Mar 2025", "Mar 2024", "Mar 2023", "Mar 2022", "Mar 2021", "Mar 2020", "Mar 2019"],
      rows: [
        { metric: "LIABILITIES", values: [null, null, null, null, null, null, null, null], isSectionHeader: true },
        { metric: "Equity Capital", values: [1539, 765, 760, 558, 555, 551, 548, 545] },
        { metric: "Reserves", values: [496400, 445800, 390400, 247400, 211200, 179100, 157000, 138200] },
        { metric: "Borrowings", values: [504000, 543800, 625800, 219700, 194400, 152200, 133500, 113400] },
        {
          metric: "Other Liabilities",
          expandable: true,
          values: [538600, 449700, 399500, 87200, 77600, 67000, 58600, 49900],
          subItems: [
            { label: "Deposits", values: [2997400, 2740500, 2397300, 1542400, 1285000, 1088300, 941800, 813300] },
            { label: "Other Liabilities", values: [538600, 449700, 399500, 87200, 77600, 67000, 58600, 49900] },
          ],
        },
        { metric: "Total Liabilities", values: [4205400, 3761300, 3452100, 2168200, 1818400, 1541500, 1338600, 1147200], bold: true, isTotal: true },
        { metric: "ASSETS", values: [null, null, null, null, null, null, null, null], isSectionHeader: true },
        {
          metric: "Net Block",
          expandable: true,
          values: [14130, 13070, 10800, 7220, 5510, 4500, 3920, 3360],
          subItems: [
            { label: "Gross Block", values: [19280, 17820, 14730, 9860, 7540, 6170, 5400, 4630] },
            { label: "Accumulated Depreciation", values: [5150, 4750, 3930, 2640, 2030, 1670, 1480, 1270] },
          ],
        },
        { metric: "Capital WIP", values: [0, 0, 0, 0, 0, 0, 0, 0] },
        { metric: "Investments", values: [1096900, 1016800, 861700, 438300, 384900, 375900, 338800, 303600] },
        {
          metric: "Other Assets",
          expandable: true,
          values: [3094400, 2731400, 2579600, 1722700, 1428000, 1161100, 995900, 840200],
          subItems: [
            { label: "Loans & Advances", values: [2741200, 2417000, 2269900, 1508600, 1242300, 1010900, 866000, 732500] },
            { label: "Cash & Bank Balances", values: [223000, 197400, 206400, 137400, 117600, 98900, 84100, 71900] },
            { label: "Other Assets", values: [130200, 117000, 103300, 76700, 68100, 51300, 45800, 35800] },
          ],
        },
        { metric: "Total Assets", values: [4205400, 3761300, 3452100, 2168200, 1818400, 1541500, 1338600, 1147200], bold: true, isTotal: true },
      ],
    },
    cashFlow: {
      periods: ["Mar 2026", "Mar 2025", "Mar 2024", "Mar 2023", "Mar 2022", "Mar 2021", "Mar 2020", "Mar 2019"],
      rows: [
        {
          metric: "Cash from Operating",
          expandable: true,
          values: [97300, 109100, 16350, 17840, -10250, 36400, 32750, 26900],
          subItems: [
            { label: "Net Profit", values: [68350, 63040, 56000, 39440, 32520, 27020, 24670, 19760] },
            { label: "Adjustments", values: [28950, 46060, -39650, -21600, -42770, 9380, 8080, 7140] },
          ],
        },
        {
          metric: "Cash from Investing",
          expandable: true,
          values: [5450, -3130, 14230, -2570, -1760, -1560, -1415, -1217],
          subItems: [
            { label: "Capex", values: [-2880, -3410, -2850, -2250, -1615, -1440, -1354, -1063] },
            { label: "Investment Purchases/Sales", values: [8330, 280, 17080, -320, -145, -120, -61, -154] },
          ],
        },
        {
          metric: "Cash from Financing",
          expandable: true,
          values: [-50530, -87880, -3415, 20530, 41240, -6280, -3600, -3260],
          subItems: [
            { label: "Debt Raised/(Repaid)", values: [-39530, -83875, 406600, -22640, 42160, -5090, -2400, -2490] },
            { label: "Dividends Paid", values: [-11000, -3950, -3415, -3270, -920, -1190, -1200, -770] },
          ],
        },
        { metric: "Net Cash Flow", values: [52220, 18090, 27165, 35800, 29230, 28560, 27735, 22423], bold: true, isTotal: true },
        { metric: "Free Cash Flow", values: [94420, 105690, 12750, 14900, -12140, 34960, 31396, 25837], bold: true },
        { metric: "CFO/OP %", values: ["97%", "98%", "38%", "35%", "4%", "73%", "68%", "61%"], isPercentage: true },
      ],
    },
  },
};
