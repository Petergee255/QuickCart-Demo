// Create this file at: app/api/clerk-webhook-test/route.js (App Router)
// Or: pages/api/clerk-webhook-test.js (Pages Router)

import { NextResponse } from 'next/server';

// For App Router
export async function POST(req) {
  try {
    const body = await req.json();
    
    console.log('=== CLERK WEBHOOK TEST ===');
    console.log('Headers:', Object.fromEntries(req.headers.entries()));
    console.log('Body:', JSON.stringify(body, null, 2));
    console.log('Event type:', body.type);
    console.log('Event data:', JSON.stringify(body.data, null, 2));
    
    if (body.data) {
      console.log('Data keys:', Object.keys(body.data));
      
      // Check for email fields specifically
      const emailFields = [
        'email',
        'email_addresses',
        'emailAddresses', 
        'primary_email_address',
        'primaryEmailAddress'
      ];
      
      emailFields.forEach(field => {
        if (body.data[field] !== undefined) {
          console.log(`Found email field '${field}':`, body.data[field]);
        }
      });
    }
    
    return NextResponse.json({ 
      message: 'Webhook received and logged',
      eventType: body.type,
      hasData: !!body.data,
      dataKeys: body.data ? Object.keys(body.data) : []
    });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}

// For Pages Router - uncomment this if you're using Pages Router instead
/*
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    
    console.log('=== CLERK WEBHOOK TEST ===');
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(body, null, 2));
    console.log('Event type:', body.type);
    console.log('Event data:', JSON.stringify(body.data, null, 2));
    
    if (body.data) {
      console.log('Data keys:', Object.keys(body.data));
      
      const emailFields = [
        'email',
        'email_addresses',
        'emailAddresses', 
        'primary_email_address',
        'primaryEmailAddress'
      ];
      
      emailFields.forEach(field => {
        if (body.data[field] !== undefined) {
          console.log(`Found email field '${field}':`, body.data[field]);
        }
      });
    }
    
    res.status(200).json({ 
      message: 'Webhook received and logged',
      eventType: body.type,
      hasData: !!body.data,
      dataKeys: body.data ? Object.keys(body.data) : []
    });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Error processing webhook' });
  }
}
*/