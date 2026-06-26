"use client"

export const dynamic = 'force-dynamic';

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/app/firebase"
import { doc, setDoc } from "firebase/firestore"
import { MapPin, Loader2, Globe } from "lucide-react"
import toast from "react-hot-toast"
import { useLanguage } from "@/contexts/LanguageContext"

export default function CompleteProfile() {
  const router = useRouter()
  const { language, setLanguage, t } = useLanguage()
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    additionalInfo: "",
  })

  const [isLocating, setIsLocating] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === "phone") {
      let numericValue = value.replace(/[^\d+]/g, "")
      if (numericValue.startsWith("+")) {
        numericValue = "+" + numericValue.slice(1).replace(/[^\d]/g, "")
      } else {
        numericValue = numericValue.replace(/[^\d]/g, "")
      }
      setFormData((prevData) => ({
        ...prevData,
        [name]: numericValue,
      }))
      return
    }
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t("completeProfile.toastLocSupport"));
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();

          if (data && data.address) {
            setFormData(prev => ({
              ...prev,
              city: data.address.city || data.address.town || data.address.village || "",
              state: data.address.state || data.address.region || "",
              postalCode: data.address.postcode || "",
              country: data.address.country || "",
              address: `${data.address.road || ""} ${data.address.house_number || ""}`.trim()
            }));
            toast.success(t("completeProfile.toastLocSuccess"));
          }
        } catch (error) {
          console.error("Error fetching address:", error);
          toast.error(t("completeProfile.toastLocFail"));
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error(t("completeProfile.toastLocFail"));
        setIsLocating(false);
      }
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const user = auth.currentUser
      if (!user) {
        toast.error(t("completeProfile.toastNoUser"))
        return
      }

      await setDoc(doc(db, "users", user.uid), {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country,
        additionalInfo: formData.additionalInfo,
        email: user.email,
        uid: user.uid,
        isAdmin: false,
        isVerified: false,
        ratingAverage: 0,
        ratingCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      localStorage.removeItem("signup_isAdmin")
      toast.success(t("completeProfile.toastSubmitSuccess"))
      router.push("/login")
    } catch (error) {
      console.error("Error saving profile:", error)
      toast.error(t("completeProfile.toastSubmitError"))
    }
  }

  return (
    <div className="min-h-screen bg-green-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      
      {/* Language switcher button */}
      <Button
        variant="ghost"
        onClick={() => setLanguage(language === "en" ? "ar" : "en")}
        className="absolute top-6 end-6 text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 hover:bg-emerald-50/50 rounded-xl font-medium px-3 py-2 transition-all duration-200"
      >
        <Globe className="h-4 w-4" />
        <span>{language === "en" ? "العربية" : "English"}</span>
      </Button>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">{t("completeProfile.title")}</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t("completeProfile.subtitle")}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="name">{t("signup.labelName")}</Label>
              <div className="mt-1">
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t("signup.placeholderName")}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">{t("completeProfile.labelPhone")}</Label>
              <div className="mt-1">
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  pattern="^\+?\d{7,15}$"
                  inputMode="numeric"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={t("completeProfile.placeholderPhone")}
                />
                <p className="text-xs text-red-500 mt-1">Please make sure this is a valid WhatsApp number with country code.</p>
              </div>
            </div>

            {/* GPS Location Button */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="w-full text-green-700 border-green-600 bg-green-50 hover:bg-green-100 hover:text-green-800 transition-all shadow-sm py-5 flex items-center justify-center"
              >
                {isLocating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <MapPin className="mr-2 h-5 w-5" />}
                {isLocating ? t("completeProfile.btnLocating") : t("completeProfile.btnLocate")}
              </Button>
            </div>

            <div>
              <Label htmlFor="country">{t("completeProfile.labelCountry")}</Label>
              <div className="mt-1">
                <Input
                  id="country"
                  name="country"
                  type="text"
                  required
                  value={formData.country}
                  onChange={handleChange}
                  placeholder={t("completeProfile.placeholderCountry")}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">{t("completeProfile.labelAddress")}</Label>
              <div className="mt-1">
                <Input
                  id="address"
                  name="address"
                  type="text"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  placeholder={t("completeProfile.placeholderAddress")}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="city">{t("completeProfile.labelCity")}</Label>
              <div className="mt-1">
                <Input
                  id="city"
                  name="city"
                  type="text"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  placeholder={t("completeProfile.placeholderCity")}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="state">{t("completeProfile.labelState")}</Label>
              <div className="mt-1">
                <Input
                  id="state"
                  name="state"
                  type="text"
                  required
                  value={formData.state}
                  onChange={handleChange}
                  placeholder={t("completeProfile.placeholderState")}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="postalCode">{t("completeProfile.labelPostal")}</Label>
              <div className="mt-1">
                <Input
                  id="postalCode"
                  name="postalCode"
                  type="text"
                  required
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder={t("completeProfile.placeholderPostal")}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="additionalInfo">{t("completeProfile.labelInfo")}</Label>
              <div className="mt-1">
                <Textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  rows={3}
                  value={formData.additionalInfo}
                  onChange={handleChange}
                  placeholder={t("completeProfile.placeholderInfo")}
                />
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full">
                {t("completeProfile.btnSubmit")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

