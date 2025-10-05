import Comment from "../models/Comment.models.js";
import Ticket from "../models/Ticket.model.js";

export const addComment = async (req, res) => {
  try {
    const { content, parentComment } = req.body;
    if (!content)
      return res.status(400).json({
        error: { code: "FIELD_REQUIRED", field: "content", message: "Comment content required" },
      });

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket)
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found" } });

    const comment = await Comment.create({
      ticket: ticket._id,
      user: req.user._id,
      content,
      parentComment: parentComment || null,
    });

    ticket.timeline.push({
      action: "Comment added",
      user: req.user._id,
    });
    await ticket.save();

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: { code: "SERVER_ERROR", message: err.message } });
  }
};
