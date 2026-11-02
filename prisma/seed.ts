import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const YEAR = new Date().getFullYear();

async function reset() {
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.serviceItem.deleteMany();
  await prisma.serviceOrder.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.technician.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.service.deleteMany();
  await prisma.instrument.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();
}

function daysAgo(n: number, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function daysAhead(n: number, hour = 10) {
  return daysAgo(-n, hour);
}

async function main() {
  await reset();

  const passwordOwner = await bcrypt.hash("owner123", 10);
  const passwordAdmin = await bcrypt.hash("admin123", 10);
  const passwordKasir = await bcrypt.hash("kasir123", 10);
  const passwordTeknisi = await bcrypt.hash("teknisi123", 10);

  const owner = await prisma.user.create({
    data: {
      name: "Bagus Prasetyo",
      email: "owner@bagusmusik.id",
      passwordHash: passwordOwner,
      role: "OWNER",
      phone: "085888058830",
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: "Sari Admin",
      email: "admin@bagusmusik.id",
      passwordHash: passwordAdmin,
      role: "ADMIN",
      phone: "081234567891",
    },
  });

  const kasir = await prisma.user.create({
    data: {
      name: "Dewi Kasir",
      email: "kasir@bagusmusik.id",
      passwordHash: passwordKasir,
      role: "KASIR",
      phone: "081234567892",
    },
  });

  const teknisiUser = await prisma.user.create({
    data: {
      name: "Rian Teknisi",
      email: "teknisi@bagusmusik.id",
      passwordHash: passwordTeknisi,
      role: "TEKNISI",
      phone: "081234567893",
    },
  });

  const teknisi2User = await prisma.user.create({
    data: {
      name: "Joko Setiawan",
      email: "joko@bagusmusik.id",
      passwordHash: passwordTeknisi,
      role: "TEKNISI",
      phone: "081234567894",
    },
  });

  const tech1 = await prisma.technician.create({
    data: {
      userId: teknisiUser.id,
      specialization: "Gitar, Bass & Elektronik",
    },
  });

  const tech2 = await prisma.technician.create({
    data: {
      userId: teknisi2User.id,
      specialization: "Drum & Keyboard",
    },
  });

  const instruments = [
    "Gitar",
    "Bass",
    "Keyboard",
    "Drum",
    "Amplifier",
    "Mikrofon",
    "Saxophone",
    "Biola",
    "Ukulele",
    "Lainnya",
  ];
  await prisma.instrument.createMany({
    data: instruments.map((name) => ({ name })),
  });

  const services = await Promise.all(
    [
      {
        code: "SRV-SETUP",
        name: "Setup & Adjustment",
        category: "Setup",
        description:
          "Setel aksi senar, intonasi, truss rod, dan kenyamanan permainan.",
        price: 150000,
        durationMin: 90,
      },
      {
        code: "SRV-SENAR",
        name: "Ganti Senar",
        category: "Perawatan",
        description:
          "Pemasangan senar baru, pembersihan fretboard, dan tuning.",
        price: 75000,
        durationMin: 45,
      },
      {
        code: "SRV-ELEKTRIK",
        name: "Servis Elektronik Gitar",
        category: "Elektronik",
        description:
          "Perbaikan potensio, jack input, pickup, dan wiring gitar/bass.",
        price: 175000,
        durationMin: 120,
      },
      {
        code: "SRV-TUNE-KEY",
        name: "Tune Up Keyboard",
        category: "Perawatan",
        description:
          "Pembersihan internal, pengecekan tombol, dan kalibrasi keyboard.",
        price: 200000,
        durationMin: 120,
      },
      {
        code: "SRV-PEDAL",
        name: "Servis Pedal Keyboard",
        category: "Elektronik",
        description: "Perbaikan sustain pedal dan pedal expression.",
        price: 125000,
        durationMin: 60,
      },
      {
        code: "SRV-DRUM",
        name: "Ganti Kulit Drum",
        category: "Drum",
        description:
          "Penggantian drum head, tuning, dan pengecekan hardware drum.",
        price: 250000,
        durationMin: 150,
      },
      {
        code: "SRV-TUNING-DRUM",
        name: "Tuning Drum",
        category: "Drum",
        description: "Tuning seluruh drum dan pengecekan kelayakan hardware.",
        price: 100000,
        durationMin: 60,
      },
      {
        code: "SRV-AMP",
        name: "Servis Amplifier",
        category: "Elektronik",
        description:
          "Diagnosis dan perbaikan amplifier, penggantian komponen rusak.",
        price: 225000,
        durationMin: 180,
      },
      {
        code: "SRV-MIC",
        name: "Perbaikan Mikrofon",
        category: "Elektronik",
        description: "Perbaikan konektor, kapsul, dan kabel mikrofon.",
        price: 100000,
        durationMin: 60,
      },
      {
        code: "SRV-UMUM",
        name: "Pemeriksaan Umum",
        category: "Diagnosis",
        description:
          "Pemeriksaan menyeluruh dan estimasi biaya perbaikan alat musik.",
        price: 50000,
        durationMin: 30,
      },
    ].map((s) =>
      prisma.service.create({
        data: {
          ...s,
          price: s.price,
        },
      }),
    ),
  );

  const serviceByCode = Object.fromEntries(services.map((s) => [s.code, s]));

  const supplier1 = await prisma.supplier.create({
    data: {
      name: "CV Nada Jaya",
      contact: "Hendra",
      phone: "022-1234567",
      email: "sales@nadajaya.co.id",
      address: "Kab. Pekalongan Kec. Kajen Ds. Tambakroto Dk. Kelapasawit",
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      name: "Toko Sparepart Harmoni",
      contact: "Lina",
      phone: "022-7654321",
      email: "order@harmonipart.id",
      address: "Kab. Pekalongan Kec. Kajen Ds. Tambakroto Dk. Kelapasawit",
    },
  });

  const supplier3 = await prisma.supplier.create({
    data: {
      name: "Distributor Audio Nusantara",
      contact: "Bambang",
      phone: "021-5551234",
      email: "bambang@audionusantara.com",
      address: "Jl. Mangga Dua No. 12, Jakarta",
    },
  });

  const inventorySeed = [
    ["SP-001", "Senar Gitar Elixir 010", "Senar", supplier1.id, 145000, 185000, 24, 6],
    ["SP-002", "Senar Bass D'Addario 045", "Senar", supplier1.id, 210000, 265000, 12, 4],
    ["SP-003", "Jack Input Switchcraft", "Elektronik", supplier2.id, 35000, 60000, 30, 10],
    ["SP-004", "Potensio Volume 500K", "Elektronik", supplier2.id, 25000, 45000, 40, 10],
    ["SP-005", "Kabel Instrument 3m", "Kabel", supplier2.id, 40000, 70000, 18, 5],
    ["SP-006", "Pick Gitar Medium (pack)", "Aksesoris", supplier1.id, 12000, 25000, 50, 15],
    ["SP-007", "Bridge Gitar Strat", "Hardware", supplier1.id, 150000, 225000, 6, 3],
    ["SP-008", "Nut Gitar Tulang", "Hardware", supplier1.id, 45000, 80000, 14, 4],
    ["SP-009", "Baut Pickguard Set", "Hardware", supplier2.id, 8000, 18000, 60, 20],
    ["SP-010", "Stik Drum Vic Firth 5A", "Drum", supplier3.id, 85000, 120000, 22, 8],
    ["SP-011", "Drum Head Remo 14\"", "Drum", supplier3.id, 180000, 250000, 5, 4],
    ["SP-012", "Mika Drum 16\"", "Drum", supplier3.id, 95000, 145000, 3, 4],
    ["SP-013", "Jack XLR Neutrik", "Elektronik", supplier2.id, 45000, 75000, 25, 8],
    ["SP-014", "Cleaner Fretboard 100ml", "Perawatan", supplier1.id, 30000, 55000, 20, 5],
    ["SP-015", "Lubricant Potensio", "Perawatan", supplier2.id, 22000, 40000, 2, 5],
  ] as const;

  const inventoryItems = [];
  for (const [sku, name, category, supplierId, purchasePrice, sellPrice, stock, minStock] of inventorySeed) {
    const item = await prisma.inventory.create({
      data: {
        sku,
        name,
        category,
        supplierId,
        purchasePrice,
        sellPrice,
        stock,
        minStock,
        unit: "pcs",
      },
    });
    inventoryItems.push(item);
    await prisma.inventoryTransaction.create({
      data: {
        inventoryId: item.id,
        type: "IN",
        qty: stock,
        note: "Stok awal",
        refType: "SEED",
      },
    });
  }

  const customersSeed = [
    ["Sutesno Wijaya", "081298765432", "sutesno@gmail.com", "Jl. Merdeka No. 10, Bandung"],
    ["Rina Kartika", "082187654321", "rina.kartika@gmail.com", "Jl. Sukajadi No. 21, Bandung"],
    ["Dimas Prakoso", "085712345678", "dimas.p@yahoo.com", "Jl. Buah Batu No. 5, Bandung"],
    ["Ayu Lestari", "081377788899", "ayu.lestari@gmail.com", "Jl. Dago No. 88, Bandung"],
    ["Fajar Nugroho", "089612345678", "fajar.nugroho@gmail.com", "Jl. Setiabudi No. 43, Bandung"],
    ["Maya Anggraini", "081511122233", "maya.anggra@gmail.com", "Jl. Pasteur No. 17, Bandung"],
    ["Bimo Saputra", "087822233344", "bimo.saputra@gmail.com", "Jl. Riau No. 9, Bandung"],
    ["Citra Dewi", "081955566677", "citra.dewi@gmail.com", "Jl. Braga No. 31, Bandung"],
    ["Hendra Gunawan", "085233344455", "hendra.g@gmail.com", "Jl. Cibiru No. 76, Bandung"],
    ["Nadia Puspita", "081266677788", "nadia.puspita@gmail.com", "Jl. Antapani No. 12, Bandung"],
    ["Rizky Ramadhan", "089788899900", "rizky.rama@gmail.com", "Jl. Kiaracondong No. 55, Bandung"],
    ["Sinta Maharani", "081399900011", "sinta.maharani@gmail.com", "Jl. Ujung Berung No. 8, Bandung"],
  ];

  const customers = [];
  for (let i = 0; i < customersSeed.length; i++) {
    const [name, whatsapp, email, address] = customersSeed[i];
    customers.push(
      await prisma.customer.create({
        data: {
          code: `CUST-${String(i + 1).padStart(4, "0")}`,
          name,
          whatsapp,
          email,
          address,
          createdAt: daysAgo(80 - i * 4),
        },
      }),
    );
  }

  const bookingsSeed: Array<{
    customerIdx: number;
    instrumentType: string;
    brand: string;
    model: string;
    complaint: string;
    serviceIdx: number;
    day: number;
    time: string;
    status: string;
  }> = [
    { customerIdx: 0, instrumentType: "Gitar", brand: "Yamaha", model: "F310", complaint: "Bunyi dengung saat senar ditekan di fret 3 dan aksi senar terlalu tinggi.", serviceIdx: 0, day: 0, time: "10:00", status: "MENUNGGU" },
    { customerIdx: 1, instrumentType: "Keyboard", brand: "Roland", model: "E-X20", complaint: "Beberapa tuts di oktaf tengah tidak mengeluarkan suara.", serviceIdx: 3, day: 0, time: "13:00", status: "DIKONFIRMASI" },
    { customerIdx: 2, instrumentType: "Amplifier", brand: "Marshall", model: "MG10", complaint: "Suara pecah dan kadang mati saat volume dinaikkan.", serviceIdx: 7, day: 1, time: "11:00", status: "MENUNGGU_PEMBAYARAN" },
    { customerIdx: 3, instrumentType: "Drum", brand: "Pearl", model: "Export", complaint: "Kulit snare sudah sobek, perlu ganti dan tuning ulang.", serviceIdx: 5, day: 1, time: "15:30", status: "DP_DIBAYAR" },
    { customerIdx: 4, instrumentType: "Bass", brand: "Squier", model: "Jazz Bass", complaint: "Jack input longgar dan suara putus-putus.", serviceIdx: 2, day: 2, time: "09:30", status: "DIJADWALKAN" },
    { customerIdx: 5, instrumentType: "Gitar", brand: "Ibanez", model: "RG350", complaint: "Potensio volume kotor, suara kresek-kresek.", serviceIdx: 2, day: 5, time: "14:00", status: "ALAT_DITERIMA" },
    { customerIdx: 6, instrumentType: "Mikrofon", brand: "Shure", model: "SM58", complaint: "Mikrofon tidak keluar suara, konektor XLR goyang.", serviceIdx: 8, day: 6, time: "10:30", status: "DIAGNOSIS" },
    { customerIdx: 7, instrumentType: "Gitar", brand: "Taylor", model: "GS Mini", complaint: "Setup ulang setelah ganti senar dan pembersihan menyeluruh.", serviceIdx: 1, day: 7, time: "16:00", status: "MENUNGGU_PERSETUJUAN" },
    { customerIdx: 8, instrumentType: "Keyboard", brand: "Korg", model: "SP-280", complaint: "Pedal sustain tidak berfungsi.", serviceIdx: 4, day: 8, time: "11:00", status: "DALAM_PENGERJAAN" },
    { customerIdx: 9, instrumentType: "Ukulele", brand: "Kala", model: "KA-15S", complaint: "Fret buzz dan senar cepat berkarat.", serviceIdx: 0, day: 9, time: "13:30", status: "SELESAI" },
    { customerIdx: 10, instrumentType: "Gitar", brand: "Cort", model: "AD810", complaint: "Ganti senar dan bersihkan body gitar.", serviceIdx: 1, day: 12, time: "10:00", status: "SIAP_DIAMBIL" },
    { customerIdx: 11, instrumentType: "Drum", brand: "Tama", model: "Imperialstar", complaint: "Tuning tom dan perbaikan dudukan cymbal.", serviceIdx: 6, day: 15, time: "15:00", status: "LUNAS" },
  ];

  const bookings = [];
  for (let i = 0; i < bookingsSeed.length; i++) {
    const b = bookingsSeed[i];
    const date = daysAhead(b.day);
    const booking = await prisma.booking.create({
      data: {
        bookingNumber: `BK-${YEAR}-${String(i + 1).padStart(5, "0")}`,
        customerId: customers[b.customerIdx].id,
        instrumentType: b.instrumentType,
        brand: b.brand,
        model: b.model,
        complaint: b.complaint,
        serviceId: services[b.serviceIdx].id,
        date,
        time: b.time,
        status: b.status,
        source: i % 3 === 0 ? "qr-toko" : "web",
        createdAt: daysAgo(Math.max(0, 10 - i)),
      },
    });
    bookings.push(booking);
  }

  const ordersSeed: Array<{
    bookingIdx: number;
    techIdx: number;
    status: string;
    diagnosis: string;
    serviceFee: number;
    estimate: number;
    itemCodes: Array<[string, number]>;
    day: number;
  }> = [
    {
      bookingIdx: 4,
      techIdx: 0,
      status: "IN_PROGRESS",
      diagnosis: "Jack input aus dan wiring ground lepas. Perlu penggantian jack dan penyolderan ulang.",
      serviceFee: 150000,
      estimate: 235000,
      itemCodes: [["SP-003", 1]],
      day: 4,
    },
    {
      bookingIdx: 5,
      techIdx: 0,
      status: "DIAGNOSING",
      diagnosis: "",
      serviceFee: 100000,
      estimate: 145000,
      itemCodes: [["SP-004", 1]],
      day: 5,
    },
    {
      bookingIdx: 6,
      techIdx: 0,
      status: "WAITING_APPROVAL",
      diagnosis: "Konektor XLR retak dan kabel internal putus. Perlu ganti jack XLR.",
      serviceFee: 100000,
      estimate: 175000,
      itemCodes: [["SP-013", 1]],
      day: 6,
    },
    {
      bookingIdx: 8,
      techIdx: 1,
      status: "IN_PROGRESS",
      diagnosis: "Pedal sustain rusak pada switch. Perlu penggantian pedal.",
      serviceFee: 125000,
      estimate: 125000,
      itemCodes: [],
      day: 8,
    },
    {
      bookingIdx: 9,
      techIdx: 0,
      status: "COMPLETED",
      diagnosis: "Fret dirapikan, senar diganti, dan neck disetel ulang.",
      serviceFee: 150000,
      estimate: 185000,
      itemCodes: [["SP-001", 1]],
      day: 9,
    },
    {
      bookingIdx: 10,
      techIdx: 0,
      status: "READY_FOR_PICKUP",
      diagnosis: "Senar diganti dan body dibersihkan. Alat siap diambil.",
      serviceFee: 75000,
      estimate: 185000,
      itemCodes: [["SP-001", 1]],
      day: 11,
    },
    {
      bookingIdx: 11,
      techIdx: 1,
      status: "PAID",
      diagnosis: "Tuning seluruh drum dan dudukan cymbal diperbaiki.",
      serviceFee: 175000,
      estimate: 175000,
      itemCodes: [["SP-010", 2]],
      day: 14,
    },
    {
      bookingIdx: 3,
      techIdx: 1,
      status: "IN_PROGRESS",
      diagnosis: "Kulit snare sobek, perlu penggantian drum head 14 inci.",
      serviceFee: 200000,
      estimate: 450000,
      itemCodes: [["SP-011", 1]],
      day: 2,
    },
    {
      bookingIdx: 7,
      techIdx: 0,
      status: "DRAFT",
      diagnosis: "",
      serviceFee: 0,
      estimate: 0,
      itemCodes: [],
      day: 7,
    },
  ];

  const orders = [];
  for (let i = 0; i < ordersSeed.length; i++) {
    const o = ordersSeed[i];
    const booking = bookings[o.bookingIdx];
    const order = await prisma.serviceOrder.create({
      data: {
        orderNumber: `SO-${YEAR}-${String(i + 1).padStart(5, "0")}`,
        customerId: booking.customerId,
        bookingId: booking.id,
        instrumentType: booking.instrumentType,
        brand: booking.brand,
        model: booking.model,
        complaint: booking.complaint,
        diagnosis: o.diagnosis || null,
        technicianId: o.techIdx === 0 ? tech1.id : tech2.id,
        serviceFee: o.serviceFee,
        estimateCost: o.estimate,
        estimatedDone: daysAhead(2 + (i % 5)),
        status: o.status,
        technicianNotes:
          o.status === "COMPLETED" || o.status === "READY_FOR_PICKUP"
            ? "Sudah diuji coba dan berfungsi normal."
            : null,
        createdAt: daysAgo(Math.max(0, 7 - i)),
      },
    });
    orders.push(order);

    for (const [sku, qty] of o.itemCodes) {
      const inv = inventoryItems.find((item) => item.sku === sku);
      if (!inv) continue;
      await prisma.serviceItem.create({
        data: {
          serviceOrderId: order.id,
          type: "PART",
          inventoryId: inv.id,
          description: inv.name,
          qty,
          unitPrice: inv.sellPrice,
          subtotal: Number(inv.sellPrice) * qty,
        },
      });
    }

    if (o.serviceFee > 0) {
      const service = services[o.bookingIdx % services.length];
      await prisma.serviceItem.create({
        data: {
          serviceOrderId: order.id,
          type: "JASA",
          serviceId: service.id,
          description: service.name,
          qty: 1,
          unitPrice: o.serviceFee,
          subtotal: o.serviceFee,
        },
      });
    }
  }

  const salesSeed: Array<{
    customerIdx: number;
    orderIdx: number;
    items: Array<[string, number, number]>;
    discount: number;
    paid: number;
    status: string;
    day: number;
  }> = [
    {
      customerIdx: 9,
      orderIdx: 4,
      items: [["JASA:Setup & Adjustment", 1, 150000], ["PART:SP-001", 1, 185000]],
      discount: 0,
      paid: 335000,
      status: "PAID",
      day: 9,
    },
    {
      customerIdx: 10,
      orderIdx: 5,
      items: [["JASA:Ganti Senar", 1, 75000], ["PART:SP-001", 1, 185000]],
      discount: 25000,
      paid: 200000,
      status: "PARTIAL",
      day: 11,
    },
    {
      customerIdx: 11,
      orderIdx: 6,
      items: [["JASA:Tuning Drum", 1, 175000], ["PART:SP-010", 2, 120000]],
      discount: 15000,
      paid: 400000,
      status: "PAID",
      day: 14,
    },
    {
      customerIdx: 0,
      orderIdx: -1,
      items: [["JASA:Pemeriksaan Umum", 1, 50000], ["PART:SP-014", 1, 55000]],
      discount: 0,
      paid: 105000,
      status: "PAID",
      day: 3,
    },
    {
      customerIdx: 3,
      orderIdx: 7,
      items: [["JASA:Ganti Kulit Drum", 1, 200000], ["PART:SP-011", 1, 250000]],
      discount: 0,
      paid: 150000,
      status: "PARTIAL",
      day: 2,
    },
  ];

  const sales = [];
  for (let i = 0; i < salesSeed.length; i++) {
    const s = salesSeed[i];
    const order = s.orderIdx >= 0 ? orders[s.orderIdx] : null;
    const subtotal = s.items.reduce((sum, [, qty, price]) => sum + qty * price, 0);
    const total = subtotal - s.discount;
    const sale = await prisma.sale.create({
      data: {
        saleNumber: `SL-${YEAR}-${String(i + 1).padStart(5, "0")}`,
        customerId: customers[s.customerIdx].id,
        serviceOrderId: order?.id ?? null,
        subtotal,
        discount: s.discount,
        total,
        paid: s.paid,
        paymentStatus: s.status,
        cashierId: kasir.id,
        createdAt: daysAgo(s.day, 15),
      },
    });
    sales.push(sale);

    for (const [label, qty, price] of s.items) {
      const [type, ref] = label.split(":");
      const isPart = type === "PART";
      const inv = isPart ? inventoryItems.find((item) => item.sku === ref) : null;
      const svc = !isPart ? services.find((item) => item.name === ref) : null;
      await prisma.saleItem.create({
        data: {
          saleId: sale.id,
          type: isPart ? "PART" : "JASA",
          inventoryId: inv?.id ?? null,
          serviceId: svc?.id ?? null,
          description: isPart ? (inv?.name ?? ref) : ref,
          qty,
          unitPrice: price,
          subtotal: qty * price,
        },
      });
    }

    await prisma.payment.create({
      data: {
        saleId: sale.id,
        customerId: customers[s.customerIdx].id,
        serviceOrderId: order?.id ?? null,
        amount: s.paid,
        method: i % 2 === 0 ? "QRIS" : "TRANSFER",
        type: s.status === "PAID" ? "PELUNASAN" : "DP",
        paidAt: daysAgo(s.day, 15),
        cashierId: kasir.id,
      },
    });

    await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${YEAR}-${String(i + 1).padStart(5, "0")}`,
        saleId: sale.id,
        customerId: customers[s.customerIdx].id,
        total,
        status: s.status === "PAID" ? "PAID" : "UNPAID",
        issuedAt: daysAgo(s.day, 15),
        dueAt: daysAhead(7 - s.day),
      },
    });
  }

  const expenses = [
    ["Operasional", "Listrik dan air bengkel", 750000, 2],
    ["Pembelian Stok", "Restock senar dan aksesoris", 1850000, 5],
    ["Gaji", "Upah teknisi mingguan", 2400000, 7],
    ["Operasional", "Internet dan telepon", 450000, 10],
    ["Peralatan", "Pembelian alat solder baru", 650000, 14],
    ["Operasional", "Konsumsi dan kebersihan", 300000, 18],
  ] as const;

  for (const [category, description, amount, day] of expenses) {
    await prisma.expense.create({
      data: {
        category,
        description,
        amount,
        date: daysAgo(day),
        createdBy: owner.id,
      },
    });
  }

  const settings: Record<string, string> = {
    businessName: "BagusMusik",
    tagline: "Servis & Reparasi Alat Musik",
    address: "Kab. Pekalongan Kec. Kajen Ds. Tambakroto Dk. Kelapasawit",
    phone: "085888058830",
    whatsapp: "085888058830",
    email: "baguswidagdo117@gamil.com",
    openingHours: "Senin - Sabtu, 09.00 - 20.00 WIB",
    bookingMode: "GRATIS",
    dpNominal: "50000",
    dpPercent: "30",
    paymentDeadlineHours: "24",
    cancellationPolicy:
      "Booking gratis dapat dibatalkan kapan saja. DP yang sudah dibayar dikembalikan maksimal 50% bila servis belum dimulai.",
    invoiceFooter:
      "Terima kasih telah mempercayakan alat musik Anda kepada BagusMusik.",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.create({ data: { key, value } });
  }

  await prisma.notification.createMany({
    data: [
      {
        userId: admin.id,
        title: "Booking baru menunggu konfirmasi",
        message: "Sutesno Wijaya mengajukan booking servis gitar Yamaha F310.",
        link: "/admin/bookings",
      },
      {
        userId: owner.id,
        title: "Stok menipis",
        message: "Lubricant Potensio tersisa 2 pcs (minimum 5).",
        link: "/admin/inventory",
      },
      {
        userId: teknisiUser.id,
        title: "Pekerjaan baru ditugaskan",
        message: "SO aktif untuk Bass Squier Jazz Bass.",
        link: "/tech",
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: "SEED",
        entity: "System",
        meta: JSON.stringify({ message: "Data demo BagusMusik dimuat" }),
      },
      {
        userId: admin.id,
        action: "BOOKING_CONFIRM",
        entity: "Booking",
        entityId: bookings[1].id,
        meta: JSON.stringify({ status: "DIKONFIRMASI" }),
      },
      {
        userId: owner.id,
        action: "REPORT_VIEW",
        entity: "Report",
        meta: JSON.stringify({ report: "revenue" }),
      },
    ],
  });

  console.log("Seed selesai.");
  console.log("Login: owner@bagusmusik.id / owner123");
  console.log("       admin@bagusmusik.id / admin123");
  console.log("       kasir@bagusmusik.id / kasir123");
  console.log("       teknisi@bagusmusik.id / teknisi123");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
