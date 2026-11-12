import { Router } from 'express';
import Hotel from '../models/Hotel.js';
import Destination from '../models/Destination.js';

const router = Router();

router.get('/hotels', async (req, res) => {
  const hotels = await Hotel.find({
    status: 'published',
    images: { $elemMatch: { url: /^https?:\/\//i } },
  }).sort({ order: 1, name: 1 }).lean();
  res.json(hotels.map(({ _id, __v, ...hotel }) => hotel));
});

router.get('/destinations', async (_req, res) => {
  const destinations = await Destination.find().sort({ name: 1 }).lean();
  res.json(destinations.map(({ _id, __v, ...destination }) => destination));
});

export default router;
