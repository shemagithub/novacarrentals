import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, Mail, MapPin, MessageSquare, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PricingCalculator } from "@/components/PricingCalculator";

const bookingSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(7, "Phone number is required"),
  pickupLocation: z.string().min(2, "Pick-up location is required"),
  dropoffLocation: z.string().min(2, "Drop-off location is required"),
  pickupDate: z.string().min(1, "Pick-up date is required"),
  returnDate: z.string().min(1, "Return date is required"),
  vehicleType: z.string().min(1, "Please select a vehicle type"),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

const vehicleTypes = [
  "Economy Car",
  "Compact Car",
  "Executive Sedan",
  "Luxury Vehicle",
  "SUV / 4x4",
  "Toyota Land Cruiser",
  "Toyota Prado",
  "Toyota RAV4",
  "Toyota Fortuner",
  "Safari Vehicle (Popup Roof)",
  "Passenger Van (14-seater)",
  "Minibus / Coaster",
  "Wedding / VIP Car",
  "Not sure — help me choose",
];

const contactDetails = [
  {
    icon: Phone,
    label: "Phone / WhatsApp",
    value: "+250 788 000 000",
    sub: "Available 24/7",
    href: "tel:+250788000000",
  },
  {
    icon: Mail,
    label: "Email",
    value: "reservations@novacar.com",
    sub: "We reply within 2 hours",
    href: "mailto:reservations@novacar.com",
  },
  {
    icon: MapPin,
    label: "Office",
    value: "Kigali International Airport Road",
    sub: "Kigali, Rwanda",
    href: "#",
  },
  {
    icon: Clock,
    label: "Office Hours",
    value: "Mon – Sat: 7:00 AM – 8:00 PM",
    sub: "Roadside support: 24/7",
    href: "#",
  },
];

export default function Contact() {
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  });

  async function onSubmit(data: BookingFormData) {
    await new Promise((r) => setTimeout(r, 1000));
    console.log("Booking inquiry submitted:", data);
    toast({
      title: "Inquiry Received",
      description: "Thank you! Our team will contact you within 2 hours to confirm your booking.",
    });
    reset();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-24 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <span className="text-primary font-bold text-sm uppercase tracking-widest">Book a Vehicle</span>
            <h1 className="text-5xl md:text-6xl font-display font-bold mt-3 mb-6">
              Let's Get You<br />on the Road.
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Fill out the form below and our team will confirm your booking within 2 hours. No commitment — just a quick, easy inquiry.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-16 items-start">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-card border border-border p-8 md:p-10">
                <h2 className="text-2xl font-display font-bold mb-8">Booking Inquiry</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="form-booking">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                        Full Name *
                      </Label>
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        {...register("fullName")}
                        data-testid="input-fullname"
                        className="bg-background border-border h-11"
                      />
                      {errors.fullName && (
                        <p className="text-destructive text-xs mt-1">{errors.fullName.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        {...register("email")}
                        data-testid="input-email"
                        className="bg-background border-border h-11"
                      />
                      {errors.email && (
                        <p className="text-destructive text-xs mt-1">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                      Phone / WhatsApp *
                    </Label>
                    <Input
                      id="phone"
                      placeholder="+250 788 000 000"
                      {...register("phone")}
                      data-testid="input-phone"
                      className="bg-background border-border h-11"
                    />
                    {errors.phone && (
                      <p className="text-destructive text-xs mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="pickupLocation" className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                        Pick-up Location *
                      </Label>
                      <Input
                        id="pickupLocation"
                        placeholder="Kigali, Rwanda"
                        {...register("pickupLocation")}
                        data-testid="input-pickup"
                        className="bg-background border-border h-11"
                      />
                      {errors.pickupLocation && (
                        <p className="text-destructive text-xs mt-1">{errors.pickupLocation.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="dropoffLocation" className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                        Drop-off Location *
                      </Label>
                      <Input
                        id="dropoffLocation"
                        placeholder="Same or specify"
                        {...register("dropoffLocation")}
                        data-testid="input-dropoff"
                        className="bg-background border-border h-11"
                      />
                      {errors.dropoffLocation && (
                        <p className="text-destructive text-xs mt-1">{errors.dropoffLocation.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="pickupDate" className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                        Pick-up Date *
                      </Label>
                      <Input
                        id="pickupDate"
                        type="date"
                        {...register("pickupDate")}
                        data-testid="input-pickup-date"
                        className="bg-background border-border h-11"
                      />
                      {errors.pickupDate && (
                        <p className="text-destructive text-xs mt-1">{errors.pickupDate.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="returnDate" className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                        Return Date *
                      </Label>
                      <Input
                        id="returnDate"
                        type="date"
                        {...register("returnDate")}
                        data-testid="input-return-date"
                        className="bg-background border-border h-11"
                      />
                      {errors.returnDate && (
                        <p className="text-destructive text-xs mt-1">{errors.returnDate.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                      Vehicle Type *
                    </Label>
                    <Select onValueChange={(val) => setValue("vehicleType", val)}>
                      <SelectTrigger
                        className="bg-background border-border h-11 w-full"
                        data-testid="select-vehicle"
                      >
                        <SelectValue placeholder="Select a vehicle type" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleTypes.map((vt) => (
                          <SelectItem key={vt} value={vt}>
                            {vt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.vehicleType && (
                      <p className="text-destructive text-xs mt-1">{errors.vehicleType.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                      Additional Notes
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Chauffeur needed? Cross-border travel? Special requirements?"
                      {...register("notes")}
                      data-testid="textarea-notes"
                      className="bg-background border-border min-h-[100px] resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-14 font-display font-semibold uppercase tracking-wider text-sm gap-3"
                    disabled={isSubmitting}
                    data-testid="button-submit"
                  >
                    {isSubmitting ? "Sending Inquiry..." : "Send Booking Inquiry"}
                    {!isSubmitting && <Send className="w-4 h-4" />}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    No payment required. Our team will contact you to confirm details and pricing.
                  </p>
                </form>
              </div>
            </motion.div>

            {/* Contact Info + Calculator */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Pricing Calculator */}
              <PricingCalculator />

              <div>
                <h2 className="text-2xl font-display font-bold mb-2">Contact Details</h2>
                <p className="text-muted-foreground text-sm">
                  Prefer to talk directly? Reach us via phone, WhatsApp, or email. We're available 24/7 for urgent requests.
                </p>
              </div>

              <div className="space-y-4">
                {contactDetails.map((c, i) => (
                  <motion.a
                    href={c.href}
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    data-testid={`contact-detail-${i}`}
                    className="flex items-start gap-4 bg-card border border-border p-5 group hover:border-primary/50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-background flex items-center justify-center shrink-0 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <c.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-0.5">{c.label}</p>
                      <p className="font-semibold text-sm text-foreground">{c.value}</p>
                      <p className="text-xs text-primary mt-0.5">{c.sub}</p>
                    </div>
                  </motion.a>
                ))}
              </div>

              {/* WhatsApp Shortcut */}
              <div className="bg-primary/10 border border-primary/20 p-6">
                <div className="flex items-start gap-3 mb-4">
                  <MessageSquare className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-display font-bold text-base">Chat on WhatsApp</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      For fastest response, message us directly on WhatsApp. Most inquiries answered within 15 minutes.
                    </p>
                  </div>
                </div>
                <a
                  href="https://wa.me/250788000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-whatsapp"
                >
                  <Button className="w-full font-display uppercase tracking-wider text-xs" size="lg">
                    Open WhatsApp Chat
                  </Button>
                </a>
              </div>

              {/* Guarantee box */}
              <div className="bg-card border border-border p-6">
                <h3 className="font-display font-bold text-base mb-3">Our Booking Guarantee</h3>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  {[
                    "No payment until confirmed",
                    "Response within 2 hours",
                    "Transparent pricing — no hidden fees",
                    "Free cancellation 48h before pickup",
                  ].map((g, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full shrink-0"></span>
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
