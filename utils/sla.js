import cron from "node-cron";
import Ticket from "../models/Ticket.model.js";

/**
 * used chatgpt here⭐😊
 * Calculate SLA deadline based on ticket priority
 * @param {string} priority - low | medium | high
 * @returns {Date} SLA deadline
 */
export const calculateSLA = (priority) => {
  const hours = { low: 24, medium: 12, high: 6 };
  return new Date(Date.now() + (hours[priority] || 12) * 60 * 60 * 1000);
};


export const slaCronJob = () => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      const now = new Date();

      const tickets = await Ticket.find({
        breached: false,
        status: { $nin: ["resolved", "closed"] },
        slaDeadline: { $lte: now },
      });

      for (const ticket of tickets) {
        ticket.breached = true;
        ticket.timeline.push({
          action: "SLA breached",
          user: null, 
        });
        await ticket.save();
        console.log(`⚠️ SLA breached for ticket: ${ticket._id}`);
      }
    } catch (err) {
      console.error("SLA Cron Error:", err.message);
    }
  });

  console.log("⏰ SLA Cron Job started: running every 5 minutes");
};