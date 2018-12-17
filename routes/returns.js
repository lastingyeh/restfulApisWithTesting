const express = require('express');
const moment = require('moment');
const Joi = require('joi');
const router = express.Router();

const { Rental } = require('../models/rental');
const { Movie } = require('../models/movie');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/', [auth, validate(validateReturn)], async (req, res) => {
	const { customerId, movieId } = req.body;

	const rental = await Rental.lookup(customerId, movieId);
	
	if (!rental) {
		return res.send(404).send('Rental not found.');
	}

	if (rental.dateReturned) {
		return res.status(400).send('Return already processed.');
	}
	// calculate rental related
	rental.return();

	await rental.save();

	await Movie.update({ _id: rental.movie._id }, { $inc: { numberInStock: 1 } });

	return res.send(rental);
});

function validateReturn(req) {
	const schema = {
		customerId: Joi.objectId().required(),
		movieId: Joi.objectId().required(),
	};

	return Joi.validate(req, schema);
}

module.exports = router;
