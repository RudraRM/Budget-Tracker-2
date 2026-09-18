import * as XLSX from "xlsx";
import {
  budgetSchema,
  budgetTotals,
  monthly,
  type Budget,
  type BudgetItem,
} from "@/lib/finance";

export function createBudgetWorkbook(input: Budget) {
  const budget = budgetSchema.parse(input);
  const workbook = XLSX.utils.book_new();
  workbook.Props = {
    Title: budget.title,
    Author: "Folio",
    Subject: `Personal budget (${budget.currency})`,
    CreatedDate: new Date(),
  };
  const totals = budgetTotals(budget);
  const overview = XLSX.utils.aoa_to_sheet([
    [budget.title],
    ["Currency", budget.currency],
    ["Planning notes", budget.summary],
    [],
    ["Monthly summary", "Amount"],
    ["Income", totals.income],
    ["Expenses", totals.expenses],
    ["Savings allocation", totals.savings],
    ["Unallocated", { t: "n", f: "B6-B7-B8", v: totals.remaining }],
    [],
    [
      "Frequency rules",
      "Weekly × 52 ÷ 12; yearly ÷ 12; one-time items excluded from recurring monthly totals.",
    ],
    [
      "Review",
      "AI estimates require your review. Negative unallocated amounts indicate an overcommitted plan.",
    ],
  ]);
  overview["!cols"] = [{ wch: 24 }, { wch: 100 }];
  for (let r = 6; r <= 9; r++)
    if (overview[`B${r}`]) overview[`B${r}`].z = "#,##0.00;[Red](#,##0.00)";
  XLSX.utils.book_append_sheet(workbook, overview, "Summary");
  const sections: [string, BudgetItem[]][] = [
    ["Income Streams", budget.incomeStreams],
    ["Fixed Expenses", budget.fixedExpenses],
    ["Variable Expenses", budget.variableExpenses],
    ["Savings Targets", budget.savingsTargets],
  ];
  for (const [name, items] of sections) {
    const sheet = XLSX.utils.aoa_to_sheet([
      [
        "Item",
        `Estimated Cost (${budget.currency})`,
        "Frequency",
        "Priority",
        `Monthly Equivalent (${budget.currency})`,
      ],
      ...items.map((item, index) => {
        const r = index + 2;
        return [
          item.item,
          item.estimatedCost,
          item.frequency,
          item.priority,
          {
            t: "n",
            v: monthly(item),
            f: `IF(C${r}="Weekly",B${r}*52/12,IF(C${r}="Yearly",B${r}/12,IF(C${r}="One-time",0,B${r})))`,
          },
        ];
      }),
    ]);
    const totalRow = items.length + 2;
    XLSX.utils.sheet_add_aoa(
      sheet,
      [
        [
          "Monthly total",
          "",
          "",
          "",
          {
            t: "n",
            v: items.reduce((sum, item) => sum + monthly(item), 0),
            f: items.length ? `SUM(E2:E${totalRow - 1})` : "0",
          },
        ],
      ],
      { origin: `A${totalRow}` },
    );
    sheet["!cols"] = [
      { wch: 36 },
      { wch: 24 },
      { wch: 16 },
      { wch: 16 },
      { wch: 28 },
    ];
    sheet["!autofilter"] = { ref: `A1:E${Math.max(1, totalRow - 1)}` };
    for (let r = 2; r <= totalRow; r++)
      for (const c of ["B", "E"])
        if (sheet[`${c}${r}`]) sheet[`${c}${r}`].z = "#,##0.00;[Red](#,##0.00)";
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  }
  return workbook;
}
export function downloadBudget(budget: Budget) {
  const name =
    budget.title.replace(/[^a-z0-9-]/gi, "-").slice(0, 60) || "budget";
  XLSX.writeFile(createBudgetWorkbook(budget), `${name}.xlsx`, {
    compression: true,
  });
}
