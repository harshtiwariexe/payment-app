import express from "express";
import db from "@repo/db/client";

const app = express();
const PORT = 3005;

// Middleware to parse JSON bodies
app.use(express.json());

app.post("/hdfcWebhook", async (req, res) => {
  const { token, userId, amount } = req.body;

  if (!token || !userId || !amount) {
    return res.status(400).json({
      message: "Invalid data",
      errors: [
        {
          code: "invalid_type",
          expected: "string",
          received: typeof userId === "undefined" ? "undefined" : typeof userId,
          path: ["userId"],
          message: "Required",
        },
        {
          code: "invalid_type",
          expected: "string",
          received: typeof amount === "undefined" ? "undefined" : typeof amount,
          path: ["amount"],
          message: "Required",
        },
      ],
    });
  }

  const paymentInformation = {
    token,
    userId: userId,
    amount,
  };

  try {
    const userId = Number(paymentInformation.userId);
    const amount = Number(paymentInformation.amount);

    if (isNaN(userId) || isNaN(amount)) {
      throw new Error("Invalid userId or amount");
    }

    await db.$transaction([
      db.balance.updateMany({
        where: {
          userId: userId,
        },
        data: {
          amount: {
            increment: amount,
          },
        },
      }),
      db.onRampTransaction.updateMany({
        where: {
          token: paymentInformation.token,
        },
        data: {
          status: "Success",
        },
      }),
    ]);

    res.json({
      message: "Captured",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message: "Error while processing webhook",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
