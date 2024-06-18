import express from 'express';
import prisma from '../database';

const router = express.Router();

router.use(express.json());

router.post('/identify', async (req, res) => {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    return res.status(400).json({ error: 'Email or phoneNumber must be provided.' });
  }

  try {
    // Find all contacts with the provided email or phone number
    const contacts = await prisma.contact.findMany({
      where: {
        OR: [
          { email },
          { phoneNumber }
        ],
      },
    });

    if (contacts.length === 0) {
      // If no contacts are found, create a new primary contact
      const newContact = await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: 'primary',
        },
      });

      return res.status(200).json({
        contact: {
          primaryContactId: newContact.id,
          emails: [newContact.email],
          phoneNumbers: [newContact.phoneNumber],
          secondaryContactIds: [],
        },
      });
    } else {
      // Identify the primary contact
      let primaryContact = contacts.find(c => c.linkPrecedence === 'primary') || contacts[0];
      let secondaryContacts = contacts.filter(c => c.linkPrecedence === 'secondary');

      // Check if there's a need to update the primary contact
      const conflictingPrimary = contacts.find(c => c.linkPrecedence === 'primary' && c.id !== primaryContact.id);

      if (conflictingPrimary) {
        await prisma.contact.update({
          where: { id: conflictingPrimary.id },
          data: {
            linkedId: primaryContact.id,
            linkPrecedence: 'secondary',
          },
        });
        conflictingPrimary.linkedId = primaryContact.id;
        conflictingPrimary.linkPrecedence = 'secondary';
        secondaryContacts.push(conflictingPrimary);
      }

      // Check if there's already a secondary contact that matches the new data
      const existingSecondary = contacts.find(c => c.email === email && c.phoneNumber === phoneNumber && c.linkPrecedence === 'secondary');

      if (!existingSecondary) {
        // If no existing secondary contact matches, create a new one
        const newSecondaryContact = await prisma.contact.create({
          data: {
            email,
            phoneNumber,
            linkedId: primaryContact.id,
            linkPrecedence: 'secondary',
          },
        });
        secondaryContacts.push(newSecondaryContact);
      }

      // Ensure all secondary contacts are linked correctly
      await prisma.contact.updateMany({
        where: {
          id: {
            in: secondaryContacts.map(c => c.id),
          },
        },
        data: {
          linkedId: primaryContact.id,
          linkPrecedence: 'secondary',
        },
      });

      // Re-fetch updated contacts
      const updatedContacts = await prisma.contact.findMany({
        where: {
          OR: [
            { email },
            { phoneNumber },
            { linkedId: primaryContact.id },
          ],
        },
      });

      // Extract unique emails and phone numbers
      const emails = Array.from(new Set(updatedContacts.map(c => c.email).filter(Boolean)));
      const phoneNumbers = Array.from(new Set(updatedContacts.map(c => c.phoneNumber).filter(Boolean)));
      const secondaryContactIds = updatedContacts
        .filter(c => c.linkPrecedence === 'secondary')
        .map(c => c.id);

      return res.status(200).json({
        contact: {
          primaryContactId: primaryContact.id,
          emails,
          phoneNumbers,
          secondaryContactIds,
        },
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
