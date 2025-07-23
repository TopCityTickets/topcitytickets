"use client";

import React, { useState, useEffect } from 'react';

interface SellerApplication {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  description: string;
  contact_email: string;
  contact_phone: string;
  website_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export default function AdminDashboard() {
  type View = 'applications' | 'events' | 'tickets';
  const [view, setView] = useState<View>('applications');
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchApplications(), fetchEvents(), fetchTickets()]);
      } catch (err) {
        setError('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/seller-applications');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setApplications(data.applications || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    const res = await fetch('/api/admin/events');
    const data = await res.json();
    setEvents(data.events || []);
  };

  const fetchTickets = async () => {
    const res = await fetch('/api/admin/tickets');
    const data = await res.json();
    setTickets(data.tickets || []);
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/admin/seller-applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh the applications list
      fetchApplications();
    } catch (err) {
      console.error('Error updating application:', err);
      setError(err instanceof Error ? err.message : 'Failed to update application');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-4 mb-6">
          <button onClick={() => setView('applications')} className={`px-4 py-2 rounded ${view==='applications'?'bg-blue-600 text-white':'bg-gray-200'}`}>Applications</button>
          <button onClick={() => setView('events')} className={`px-4 py-2 rounded ${view==='events'?'bg-blue-600 text-white':'bg-gray-200'}`}>Events</button>
          <button onClick={() => setView('tickets')} className={`px-4 py-2 rounded ${view==='tickets'?'bg-blue-600 text-white':'bg-gray-200'}`}>Tickets</button>
        </div>
        {view === 'applications' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900">
                Seller Applications ({applications.length})
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Review and manage seller applications
              </p>
            </div>

            {applications.length === 0 ? (
              <div className="px-4 py-5 sm:px-6 text-center">
                <p className="text-gray-500">No seller applications found</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {applications.map((application) => (
                  <li key={application.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900 truncate">
                              {application.business_name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {application.business_type} • {application.contact_email}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {application.description}
                            </p>
                            {application.website_url && (
                              <a
                                href={application.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-500 mt-1 inline-block"
                              >
                                {application.website_url}
                              </a>
                            )}
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                application.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : application.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {application.status === 'pending' && (
                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={() => updateApplicationStatus(application.id, 'approved')}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateApplicationStatus(application.id, 'rejected')}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {view === 'events' && (
          <div className="bg-white shadow sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">All Events ({events.length})</h2>
            </div>
            <ul className="divide-y divide-gray-200">
              {events.map((evt: any) => (
                <li key={evt.id} className="px-4 py-4 sm:px-6">
                  <p className="font-semibold text-gray-900">{evt.title}</p>
                  <p className="text-sm text-gray-600">{new Date(evt.date).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        {view === 'tickets' && (
          <div className="bg-white shadow sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">All Tickets ({tickets.length})</h2>
            </div>
            <ul className="divide-y divide-gray-200">
              {tickets.map((tkt: any) => (
                <li key={tkt.id} className="px-4 py-4 sm:px-6">
                  <p className="text-sm text-gray-700">Ticket ID: {tkt.id}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
