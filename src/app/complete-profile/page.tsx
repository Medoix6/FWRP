"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/app/firebase"
import { doc, setDoc } from "firebase/firestore"

export default function CompleteProfile() {
  const router = useRouter()
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const user = auth.currentUser
      if (!user) {
        alert("No authenticated user found. Please log in again.")
        return
      }

      const isAdmin = localStorage.getItem("signup_isAdmin") === "true";
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
        ...(isAdmin ? { isAdmin: true } : {}),
      })

      localStorage.removeItem("signup_isAdmin")
      router.push("/login")
    } catch (error) {
      console.error("Error saving profile:", error)
      alert("Failed to save profile. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-green-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Complete Your Profile</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please provide your address information to complete your profile.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="name">Name</Label>
              <div className="mt-1">
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
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
                  placeholder="e.g. +1234567890"
                />
                <p className="text-xs text-red-500 mt-1">Please make sure this is a valid WhatsApp number with country code.</p>
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <div className="mt-1">
                <Input
                  id="address"
                  name="address"
                  type="text"
                  required
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <div className="mt-1">
                <Input id="city" name="city" type="text" required value={formData.city} onChange={handleChange} />
              </div>
            </div>

            <div>
              <Label htmlFor="state">State / Province</Label>
              <div className="mt-1">
                <Input id="state" name="state" type="text" required value={formData.state} onChange={handleChange} />
              </div>
            </div>

            <div>
              <Label htmlFor="postalCode">Postal Code</Label>
              <div className="mt-1">
                <Input
                  id="postalCode"
                  name="postalCode"
                  type="text"
                  required
                  value={formData.postalCode}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <div className="mt-1">
                <Input
                  id="country"
                  name="country"
                  type="text"
                  required
                  value={formData.country}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
              <div className="mt-1">
                <Textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  rows={3}
                  value={formData.additionalInfo}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full">
                Complete Profile
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

