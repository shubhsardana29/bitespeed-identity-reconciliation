import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.contact.createMany({
    data: [
      {
        email: 'lorraine@hillvalley.edu',
        phoneNumber: '123456',
      },
      {
        email: 'mcfly@hillvalley.edu',
        phoneNumber: '123456',
      }
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
