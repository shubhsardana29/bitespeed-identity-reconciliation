"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = __importDefault(require("../database"));
const router = express_1.default.Router();
router.use(express_1.default.json());
router.post('/identify', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, phoneNumber } = req.body;
    if (!email && !phoneNumber) {
        return res.status(400).json({ error: 'Email or phoneNumber must be provided.' });
    }
    try {
        // Find all contacts with the provided email or phone number
        const contacts = yield database_1.default.contact.findMany({
            where: {
                OR: [
                    { email },
                    { phoneNumber }
                ],
            },
        });
        if (contacts.length === 0) {
            // If no contacts are found, create a new primary contact
            const newContact = yield database_1.default.contact.create({
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
        }
        else {
            // Identify the primary contact
            let primaryContact = contacts.find(c => c.linkPrecedence === 'primary') || contacts[0];
            let secondaryContacts = contacts.filter(c => c.linkPrecedence === 'secondary');
            // Check if there's a need to update the primary contact
            const conflictingPrimary = contacts.find(c => c.linkPrecedence === 'primary' && c.id !== primaryContact.id);
            if (conflictingPrimary) {
                yield database_1.default.contact.update({
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
                const newSecondaryContact = yield database_1.default.contact.create({
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
            yield database_1.default.contact.updateMany({
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
            const updatedContacts = yield database_1.default.contact.findMany({
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
