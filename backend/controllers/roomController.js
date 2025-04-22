const Room = require('../models/Room');

exports.createRoom = async (req, res) => {
    try {
      if (req.user.role !== "support") {
        return res
          .status(403)
          .json({ message: "only site suppurt can create room!" });
      }
  
      const { name } = req.body;
      const existingRoom = await Room.findOne({ name });
      if (existingRoom) {
        return res.status(400).json({ message: "This room already exist" });
      }
      const room = new Room({
        name,
        creator: req.user.id,
      });
      await room.save();
      res.status(201).json({ id: room._id, name: room.name });
    } catch (err) {
      console.error("Error creating room:", err);
      res.status(500).json({ message: "Error creating room" });
    }
}

exports.editRoom = async (req, res) => {
    try {
      if (req.user.role !== "support") {
        return res
          .status(403)
          .json({ message: "only site suppurt can edit room!" });
      }
  
      const { name } = req.body;
      const room = await Room.findById(req.params.id);
      if (!room) {
        return res.status(404).json({ message: "Could not found the room" });
      }
  
      if (room.name === "general") {
        return res
          .status(403)
          .json({ message: "Could not edit general room" });
      }
  
      const existingRoom = await Room.findOne({ name });
      if (existingRoom && existingRoom._id.toString() !== req.params.id) {
        return res.status(400).json({ message: "A room exist with this name" });
      }
  
      room.name = name;
      await room.save();
      res.json({ id: room._id, name: room.name });
    } catch (err) {
      console.error("Error updating room:", err);
      res.status(500).json({ message: "Error editing room" });
    }
}

exports.deleteRoom = async (req, res) => {
    try {
      if (req.user.role !== "support") {
        return res
          .status(403)
          .json({ message: "only site suppurt can delete room!" });
      }
  
      const room = await Room.findById(req.params.id);
      if (!room) {
        return res.status(404).json({ message: "Could not found the room" });
      }
  
      if (room.name === "general") {
        return res
          .status(403)
          .json({ message: "Could not delete the general room" });
      }
  
      await Room.deleteOne({ _id: req.params.id });
      res.json({ message: "deleting room was successful" });
    } catch (err) {
      console.error("Error deleting room:", err);
      res.status(500).json({ message: "Error deleting room" });
    }
}

exports.getRooms = async (req, res) => {
    try {
      const rooms = await Room.find().select("name");
      res.json(rooms.map((room) => ({ id: room._id, name: room.name })));
    } catch (err) {
      res.status(500).json({ message: " Error in retrieving room list" });
    }
}