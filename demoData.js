const appData = {
  "userSettings": {
    "hourlyWage": 42,
    "sector": "מגזר פרטי 6 ימי עבודה שבועיים",
    "startDay": 1,
    "startDate": "2023-01-01",
    "workRules": {
      "dailyHours": 8.6
    }
  },
  "taxSettings": {
    "taxExempt": false,
    "creditPoints": 2.25,
    "hishtalmut": 2.5,
    "pension": 6,
    "severance": 8.33,
    "jobOnly": true,
    "noBituahLeumi": false,
    "noHealthTax": false,
    "enableSettlementDiscount": true,
    "settlementDiscountPercent": 10,
    "settlementAnnualLimit": 120000
  },
  "specialDaysSettings": {
    "havraAmount": 418,
    "milAmount": 300,
    "sickDays": {
      "day1": {
        "percent": 0
      },
      "day2": {
        "percent": 50
      },
      "day3": {
        "percent": 75
      },
      "day4Plus": {
        "percent": 100
      }
    },
    "vacation": {
      "hours": 8,
      "percent": 100
    }
  },
  "additionalSalaryData": {
    "bonusAmount": 300,
    "carValue": 300,
    "carIncludeInGross": true,
    "carIncludeInTax": true,
    "carIncludeInPension": true,
    "mealValue": 30,
    "travelRefund": 200,
    "shiftAddition": 250,
    "phoneAllowance": 150,
    "globalOvertime": 400,
    "giftValue": 200,
    "mealsIncludeShortDays": true,
    "havraaValue": 378,
    "havraaPayments": [
      {
        "month": "2025-04",
        "count": 5
      }
    ]
  },
  "manualAdjustments": [],
  "deductions": {
    "fixedTransactions": [
      {
        "type": "הוספה קבועה",
        "category": "בונוס",
        "amount": 300,
        "source": "gross",
        "id": "tx-1"
      },
      {
        "type": "הוספה קבועה",
        "category": "נסיעות",
        "amount": 200,
        "source": "net",
        "id": "tx-2"
      },
      {
        "type": "הוצאה קבועה",
        "category": "רכב",
        "amount": -500,
        "source": "gross",
        "id": "tx-3"
      },
      {
        "type": "הוצאה קבועה",
        "category": "ביטוח",
        "amount": -200,
        "source": "net",
        "id": "tx-4"
      }
    ],
    "monthlyTransactions": {
      "2025-04": [
        {
          "type": "הוספה חד פעמית",
          "category": "מתנה פסח",
          "amount": 1000,
          "source": "net",
          "id": "tx-5"
        },
        {
          "type": "הוצאה חד פעמית",
          "category": "החזר הלוואה",
          "amount": -1000,
          "source": "net",
          "id": "tx-6"
        }
      ]
    }
  },
  "months": {}
};