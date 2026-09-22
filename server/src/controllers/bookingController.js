import { Booking } from '../models/Booking.js';
import Joi from 'joi';
// TODO: write a validation schema for create/update per README.md section 2.

const bookingSchema = Joi.object({
  roomNumber: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(),
  purpose: Joi.string().optional(),
  bookedBy: Joi.string().optional(),
});
const updateBookingSchema = Joi.object({
  roomNumber: Joi.string().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  purpose: Joi.string().optional(),
  bookedBy: Joi.string().optional(),
});
// TODO: per README.md section 4, you will need a way to detect whether a
// proposed booking conflicts with an existing one on the same room.

// GET /api/bookings
// TODO: implement per README.md section 3.
export async function getAllBookings(req, res, next) {
  try {
    const bookings = await Booking.find().populate('bookedBy', 'name email');;
    res.status(200).json({ bookings });
  } catch (err) { next(err); }
}

// GET /api/bookings/:id
// TODO: implement per README.md sections 3 and 5.
export async function getBooking(req, res, next) {
  try {
    const booking = await Booking.findById(req.params.id).populate('bookedBy', 'name email');;
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.status(200).json({ booking });
  } catch (err) { next(err); }
}

// POST /api/bookings
// TODO: implement per README.md sections 3 and 4.
export async function createBooking(req, res, next) {
  try {
    const { value, error } = bookingSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    const existingBooking = await Booking.findOne({
      roomNumber: value.roomNumber,
      startDate: { $lt: value.endDate },
      endDate: { $gt: value.startDate }
    });
    if (existingBooking) {
      return res.status(409).json({ message: 'Booking conflicts with an existing booking' });
    }
    const booking = await Booking.create(value);
    res.status(201).json({ booking });
  } catch (err) { next(err); }
}

// PATCH /api/bookings/:id
// TODO: implement per README.md sections 3, 4, and 5.
export async function updateBooking(req, res, next) {
  try {
    const currentBooking = await Booking.findById(req.params.id);
    if (!currentBooking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    const { value, error } = updateBookingSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    const roomNumber = value.roomNumber ?? currentBooking.roomNumber;
    const startDate = value.startDate ?? currentBooking.startDate;
    const endDate = value.endDate ?? currentBooking.endDate;
    if (startDate >= endDate) {
      return res.status(400).json({
        message: 'startDate must be before endDate'
      });
    }
    const existingBooking = await Booking.findOne({
      roomNumber: roomNumber,
      startDate: { $lt: endDate },
      endDate: { $gt: startDate },
      _id: { $ne: req.params.id } // Exclude the booking being updated
    });
    if (existingBooking) {
      return res.status(409).json({ message: 'Booking conflicts with an existing booking' });
    }
    const booking = await Booking.findByIdAndUpdate(req.params.id, value, { new: true });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.status(200).json({ booking });
  } catch (err) { next(err); }
}

// DELETE /api/bookings/:id
// TODO: implement per README.md sections 3 and 5.
export async function deleteBooking(req, res, next) {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.status(200).json({ message: 'Booking deleted' });
  } catch (err) { next(err); }
}
