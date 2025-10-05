import Ticket from "../models/Ticket.model.js";
import Comment from "../models/Comment.models.js";

export const createTicket = async (req, res) => {
  try {
    const { title, description, priority } = req.body;
    if (!title || !description)
      return res.status(400).json({
        error: { code: "FIELD_REQUIRED", field: "title/description", message: "Required fields missing" },
      });

    const slaHours = { low: 24, medium: 12, high: 6 }[priority || "medium"];
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    const ticket = await Ticket.create({
      title,
      description,
      priority,
      createdBy: req.user._id,
      slaDeadline,
      timeline: [{ action: "Ticket created", user: req.user._id, timestamp: new Date() }],
    });

    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: { code: "SERVER_ERROR", message: err.message } });
  }
};

export const getTickets = async (req, res) => {
  try {
    const { limit = 10, offset = 0, search = "" } = req.query;

    const query = {
      $or: [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ],
    };

    const tickets = await Ticket.find(query)
      .skip(Number(offset))
      .limit(Number(limit))
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email");

    const nextOffset = tickets.length < limit ? null : Number(offset) + Number(limit);

    res.json({ items: tickets, next_offset: nextOffset });
  } catch (err) {
    res.status(500).json({ error: { code: "SERVER_ERROR", message: err.message } });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("timeline.user", "name email");

    if (!ticket)
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found" } });

    const comments = await Comment.find({ ticket: ticket._id })
      .populate("user", "name email")
      .sort({ timestamp: 1 });

    res.json({ ...ticket.toObject(), comments });
  } catch (err) {
    res.status(500).json({ error: { code: "SERVER_ERROR", message: err.message } });
  }
};

export const updateTicket = async (req, res) => {
  try {
    const { version, status, assignedTo } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket)
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found" } });

    if (ticket.version !== version)
      return res.status(409).json({ error: { code: "STALE_VERSION", message: "Ticket has been updated by another user" } });

    if (status) ticket.status = status;
    if (assignedTo) ticket.assignedTo = assignedTo;

    ticket.version += 1;
    ticket.timeline.push({
      action: `Updated ticket: ${status || "assignment"}`,
      user: req.user._id,
      timestamp: new Date(),
    });

    await ticket.save();

    const updatedTicket = await Ticket.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("timeline.user", "name email");

    res.json(updatedTicket);
  } catch (err) {
    res.status(500).json({ error: { code: "SERVER_ERROR", message: err.message } });
  }
};

export const addComment = async (req, res) => {
  try {
    const { content, parentComment } = req.body;
    if (!content)
      return res.status(400).json({ error: { code: "FIELD_REQUIRED", field: "content", message: "Comment content required" } });

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket)
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found" } });

    const comment = await Comment.create({
      ticket: ticket._id,
      user: req.user._id,
      content,
      parentComment: parentComment || null,
      timestamp: new Date(),
    });

    ticket.timeline.push({
      action: "Comment added",
      user: req.user._id,
      timestamp: new Date(),
    });

    await ticket.save();

    await comment.populate("user", "name email");

    const updatedTicket = await Ticket.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("timeline.user", "name email");

    const comments = await Comment.find({ ticket: ticket._id })
      .populate("user", "name email")
      .sort({ timestamp: 1 });

    res.status(201).json({ comment, ticket: { ...updatedTicket.toObject(), comments } });
  } catch (err) {
    res.status(500).json({ error: { code: "SERVER_ERROR", message: err.message } });
  }
};

export const getBreachedTickets = async (req, res) => {
  try {
    const breached = await Ticket.find({ breached: true })
      .populate("assignedTo createdBy", "name email");
    res.json(breached);
  } catch (err) {
    res.status(500).json({ error: { code: "SERVER_ERROR", message: err.message } });
  }
};
