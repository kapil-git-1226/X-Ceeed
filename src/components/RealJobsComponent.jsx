'use client';

import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Building, 
  Calendar, 
  DollarSign, 
  Bookmark,
  FileText,
  AlertCircle,
  Loader2,
  Download
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function RealJobsComponent({ onJobClick }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);
  const fetchJobs = async () => {
    setLoading(true);
    try {
      // Call the jobs API to get public jobs from the database
      const response = await apiClient.get('/api/jobs?public=true');
      
      if (response && response.success) {
        console.log('Fetched jobs:', response.data);
        setJobs(response.data || []);
      } else {
        console.error('Failed to fetch jobs:', response);
        setError('Failed to load jobs. Please try again later.');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('An error occurred while loading jobs.');
    } finally {
      setLoading(false);
    }
  };

  // Format the posted date as a relative time (e.g., "2 days ago")
  const formatPostedDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Recently';
    }
  };

  // Format salary range
  const formatSalary = (min, max, currency = 'USD') => {
    if (!min && !max) return 'Salary not specified';
    
    const formatNumber = (num) => {
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(0)}M`;
      }
      return `${(num / 1000).toFixed(0)}K`;
    };
    
    const currencySymbol = currency === 'USD' ? '$' : currency;
    
    if (min && max) {
      return `${currencySymbol}${formatNumber(min)} - ${currencySymbol}${formatNumber(max)}`;
    } else if (min) {
      return `From ${currencySymbol}${formatNumber(min)}`;
    } else if (max) {
      return `Up to ${currencySymbol}${formatNumber(max)}`;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-gray-400 mb-4" />
        <p className="text-gray-600">Loading job listings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-medium">Failed to load jobs</h3>
        <p className="text-gray-600 mt-2">{error}</p>
        <Button variant="outline" className="mt-4" onClick={fetchJobs}>
          Try Again
        </Button>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No jobs available</h3>
        <p className="text-sm text-gray-500 mt-1">
          There are currently no job postings available. Please check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 job-cards-container">
      {jobs.map((job) => (
        <Card 
          key={job._id} 
          className="job-card hover:shadow-lg transition-all cursor-pointer border-gray-200"
          onClick={() => onJobClick(job)}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg font-semibold">{job.title}</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <Building className="h-3 w-3 mr-1" />
                  {job.companyName || 'Company Name'}
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  const target = e.currentTarget;
                  const icon = target.querySelector('svg');
                  if (icon) {
                    const isSaved = icon.classList.toggle('text-black');
                    console.log('Save job:', job._id, isSaved ? 'saved' : 'unsaved');
                  }
                }}
              >
                <Bookmark className="h-4 w-4 transition-colors" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-y-2 mb-3">
              <div className="flex items-center text-sm text-gray-500 mr-4">
                <MapPin className="h-3 w-3 mr-1" />
                {job.workMode} {job.location ? `(${job.location})` : ''}
              </div>
              <div className="flex items-center text-sm text-gray-500 mr-4">
                <DollarSign className="h-3 w-3 mr-1" />
                {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-3 w-3 mr-1" />
                Posted {formatPostedDate(job.createdAt || new Date())}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary" className="font-normal">
                {job.jobType || 'Full-time'}
              </Badge>
              <Badge variant="secondary" className="font-normal">
                {job.department || 'General'}
              </Badge>
              <Badge variant="secondary" className="font-normal">
                {job.level || 'Entry Level'}
              </Badge>
            </div>          </CardContent>          <CardFooter className="flex flex-wrap gap-2 justify-end">
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (job.jobDescriptionFile) {
                  window.open(job.jobDescriptionFile, '_blank');
                } else {
                  // Generate a text file with job details if no file is available
                  const jobDetails = `
Job Title: ${job.title}
Company: ${job.companyName || 'Not specified'}
Department: ${job.department || 'Not specified'}
Level: ${job.level || 'Not specified'}
Work Mode: ${job.workMode || 'Not specified'}
Location: ${job.location || 'Not specified'}
Salary: ${formatSalary(job.salaryMin, job.salaryMax, job.currency)}
Job Type: ${job.jobType || 'Not specified'}
Description: ${job.description || 'No description provided.'}
                  `;
                  
                  const blob = new Blob([jobDetails], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${job.title.replace(/\s+/g, '-')}-job-description.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }
              }}
              className="flex items-center gap-1"
            >
              <Download className="h-3 w-3" />
              Download JD
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                console.log('Match resume with job:', job._id);
                // You would implement the resume matching functionality here
                alert('Resume matching feature will be available soon!');
              }}
              className="flex items-center gap-1"
            >
              <FileText className="h-3 w-3" />
              Match Resume
            </Button>
            <Button variant="outline" size="sm">View Details</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
