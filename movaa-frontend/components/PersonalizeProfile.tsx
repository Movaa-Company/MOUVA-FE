'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getUser, saveUser } from '@/lib/localStorageUtils';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const profileSchema = z.object({
  firstName: z
    .string()
    .min(2, { message: 'First name is required and must be at least 2 characters.' }),
  lastName: z
    .string()
    .min(2, { message: 'Last name is required and must be at least 2 characters.' }),
  gender: z.enum(['Male', 'Female'], { required_error: 'Gender is required.' }),
  nextOfKinName: z
    .string()
    .min(2, { message: 'Next of kin name is required and must be at least 2 characters.' }),
  nextOfKinPhone: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, { message: 'Invalid phone number format.' }),
  nextOfKinGender: z.enum(['Male', 'Female'], {
    required_error: 'Next of kin gender is required.',
  }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const PersonalizeProfile = () => {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      gender: undefined,
      nextOfKinName: '',
      nextOfKinPhone: '',
      nextOfKinGender: undefined,
    },
  });

  // Load existing user data if available (e.g., if user revisits this page)
  useEffect(() => {
    const currentUser = getUser();
    if (currentUser && currentUser.profile) {
      form.reset(currentUser.profile); // Pre-fill form with existing profile data
    }
  }, [form]);

  const onSubmit = (data: ProfileFormValues) => {
    const currentUser = getUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, profile: data };
      saveUser(updatedUser);
      toast.success('Profile saved successfully!');
      router.push('/booking-details');
    } else {
      // This case should ideally not happen if the flow is followed, but handle defensively
      toast.error('User data not found. Please sign up or sign in again.');
      router.push('/signup'); // Redirect to signup or login
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-black mb-2">Personalise your profile</h1>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First Name" {...field} className="rounded-lg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Last Name" {...field} className="rounded-lg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Next Of Kin Information */}
            <div className="space-y-4 mt-8">
              <h2 className="text-xl font-semibold text-black">Next Of Kin Information</h2>

              <FormField
                control={form.control}
                name="nextOfKinName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="First Name" {...field} className="rounded-lg" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nextOfKinGender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nextOfKinPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Phone Number" {...field} className="rounded-lg" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-6 bg-movaa-primary hover:bg-movaa-dark text-white font-baloo text-lg rounded-lg"
            >
              Sign Up
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default PersonalizeProfile;
