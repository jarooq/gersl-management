import React, { useState } from 'react';
import {
  User, MapPin, Phone, Calendar, GraduationCap, Heart,
  Home, Users, FileText, Activity, X, Hash, Stethoscope, Upload,
  UserPlus, DollarSign, Printer, FileDown, BookOpen, Package, Building2, Briefcase, FolderOpen
} from 'lucide-react';
import { useOrphans } from '../../../contexts/OrphanContext';
import { useAuth } from '../../../contexts/AuthContext';
import AssignCoordinatorModal from './AssignCoordinatorModal';
import AssignDonorModal from './AssignDonorModal';
import VisitsTab from './VisitsTab';
import ReportsTab from './ReportsTab';

const OrphanProfile = ({ orphan, onClose, onAddVisit }) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [showCoordinatorModal, setShowCoordinatorModal] = useState(false);
  const [showDonorModal, setShowDonorModal] = useState(false);
  const { assignCoordinator, assignDonor } = useOrphans();
  const { hasPermission } = useAuth();

  if (!orphan) return null;

  // Helper function to get profile photo URL
  const getProfilePhotoUrl = () => {
    try {
      console.log('OrphanProfile - Raw orphan.photos:', orphan.photos, typeof orphan.photos);

      if (!orphan.photos) {
        console.log('OrphanProfile - No photos field');
        return null;
      }

      let photos = orphan.photos;

      // If it's a string, try to parse it
      if (typeof photos === 'string') {
        try {
          photos = JSON.parse(photos);
          console.log('OrphanProfile - Parsed from string:', photos);
        } catch (e) {
          console.error('OrphanProfile - Failed to parse photos string:', e);
          return null;
        }
      }

      console.log('OrphanProfile - Photos after parsing:', photos, Array.isArray(photos));

      if (Array.isArray(photos) && photos.length > 0) {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const photoUrl = `${API_URL}${photos[0]}`;
        console.log('OrphanProfile - Final photo URL:', photoUrl);
        return photoUrl;
      } else {
        console.log('OrphanProfile - Photos is not an array or is empty');
      }
    } catch (error) {
      console.error('OrphanProfile - Error in getProfilePhotoUrl:', error);
    }
    console.log('OrphanProfile - Returning null');
    return null;
  };

  const profilePhotoUrl = getProfilePhotoUrl();
  const photoInitial = orphan.fullName?.charAt(0).toUpperCase() || 'O';

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'social', label: 'Social & Living', icon: Home },
    { id: 'health', label: 'Health', icon: Stethoscope },
    { id: 'documents', label: 'Documents', icon: FolderOpen },
    { id: 'visits', label: 'Visit Log', icon: Calendar },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'support', label: 'Support Log', icon: Package }
  ];

  const handleAssignCoordinator = () => {
    setShowCoordinatorModal(true);
  };

  const handleAssignDonor = () => {
    setShowDonorModal(true);
  };

  const handleCoordinatorAssign = async (orphanId, coordinator) => {
    const result = await assignCoordinator(orphanId, coordinator);
    if (result?.success) {
      setShowCoordinatorModal(false);
      alert('Coordinator assigned successfully!');
    }
  };

  const handleDonorAssign = (orphanId, assignmentData) => {
    assignDonor(orphanId, assignmentData);
    setShowDonorModal(false);
  };

  const handlePrintProfile = () => {
    // Create a printable version of the profile
    const printWindow = window.open('', '_blank');
    const printContent = generatePrintableProfile(orphan);

    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    };
  };

  const generatePrintableProfile = (orphan) => {
    // Generate profile photo initial if no photo available
    const photoInitial = orphan.fullName ? orphan.fullName.charAt(0).toUpperCase() : 'O';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Orphan Profile - ${orphan.fullName}</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 15mm;
            }
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.5;
            color: #1f2937;
            max-width: 210mm;
            margin: 0 auto;
            padding: 0;
            background: #ffffff;
          }

          .page-container {
            padding: 20px;
            background: linear-gradient(135deg, #fdf2f8 0%, #ffffff 100%);
            min-height: 297mm;
          }

          .header {
            position: relative;
            background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
            padding: 25px 30px;
            border-radius: 12px;
            margin-bottom: 25px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }

          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }

          .header-left {
            flex: 1;
          }

          .logo {
            font-size: 32px;
            font-weight: 900;
            color: white;
            letter-spacing: 2px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
            margin-bottom: 8px;
          }

          .org-name {
            color: #fce7f3;
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 15px;
          }

          .header h1 {
            color: white;
            font-size: 26px;
            font-weight: 700;
            margin-bottom: 5px;
          }

          .print-date {
            color: #fce7f3;
            font-size: 11px;
            margin-top: 5px;
          }

          .profile-photo-container {
            flex-shrink: 0;
            margin-left: 20px;
          }

          .profile-photo {
            width: 120px;
            height: 150px;
            border-radius: 8px;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            font-weight: bold;
            color: #ec4899;
            border: 4px solid white;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }

          .orphan-id-badge {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-block;
            font-size: 12px;
            font-weight: 600;
            margin-top: 10px;
            border: 1px solid rgba(255, 255, 255, 0.3);
          }

          .section {
            margin-bottom: 20px;
            page-break-inside: avoid;
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }

          .section-title {
            background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
            color: white;
            padding: 12px 18px;
            font-size: 15px;
            font-weight: 700;
            margin: -20px -20px 18px -20px;
            border-radius: 10px 10px 0 0;
            letter-spacing: 0.5px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .section-title::before {
            content: '';
            width: 4px;
            height: 20px;
            background: white;
            border-radius: 2px;
          }

          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .info-item {
            padding: 12px;
            background: linear-gradient(135deg, #fdf2f8 0%, #f9fafb 100%);
            border-left: 3px solid #ec4899;
            border-radius: 6px;
            transition: all 0.2s;
          }

          .info-label {
            font-weight: 700;
            color: #6b7280;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }

          .info-value {
            color: #1f2937;
            font-size: 13px;
            font-weight: 500;
          }

          .full-width {
            grid-column: 1 / -1;
          }

          .subsection-title {
            margin-top: 18px;
            margin-bottom: 12px;
            color: #ec4899;
            font-size: 14px;
            font-weight: 700;
            padding-bottom: 6px;
            border-bottom: 2px solid #fce7f3;
          }

          .death-details {
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            border-left: 3px solid #ef4444;
            padding: 15px;
            margin-top: 12px;
            border-radius: 6px;
          }

          .death-details h4 {
            color: #991b1b;
            margin-bottom: 10px;
            font-size: 13px;
            font-weight: 700;
          }

          .visit-card {
            margin-bottom: 15px;
            padding: 15px;
            background: linear-gradient(135deg, #fdf2f8 0%, #f9fafb 100%);
            border-left: 4px solid #ec4899;
            border-radius: 6px;
            page-break-inside: avoid;
          }

          .visit-header {
            font-weight: 700;
            margin-bottom: 12px;
            color: #ec4899;
            font-size: 14px;
          }

          .footer {
            margin-top: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
            border-radius: 10px;
            text-align: center;
            color: white;
          }

          .footer-title {
            font-weight: 700;
            font-size: 14px;
            margin-bottom: 5px;
            color: white;
          }

          .footer-subtitle {
            font-size: 11px;
            color: #d1d5db;
            margin-bottom: 8px;
          }

          .footer-note {
            font-size: 10px;
            color: #9ca3af;
            font-style: italic;
          }

          @media print {
            .page-container {
              background: white;
            }

            .section {
              box-shadow: none;
              border: 1px solid #e5e7eb;
            }

            .header {
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          <!-- Header with Photo -->
          <div class="header">
            <div class="header-content">
              <div class="header-left">
                <div class="logo">GERSL</div>
                <div class="org-name">Global Education and Relief Services Lanka</div>
                <h1>Orphan Profile Report</h1>
                <div class="orphan-id-badge">ID: ${orphan.orphanId || 'N/A'}</div>
                <div class="print-date">Generated: ${new Date().toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</div>
              </div>
              <div class="profile-photo-container">
                <div class="profile-photo">
                  ${photoInitial}
                </div>
              </div>
            </div>
          </div>

          <!-- Personal Information -->
          <div class="section">
            <div class="section-title">Personal Information</div>
            <div class="info-grid">
              <div class="info-item full-width">
                <div class="info-label">Full Name</div>
                <div class="info-value">${orphan.fullName || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Date of Birth</div>
                <div class="info-value">${orphan.dateOfBirth || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Age</div>
                <div class="info-value">${orphan.age || 'N/A'} years</div>
              </div>
            </div>
          </div>

        <!-- Location Information -->
        <div class="section">
          <div class="section-title">Location Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">District</div>
              <div class="info-value">${orphan.district || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Address</div>
              <div class="info-value">${orphan.address || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">GN Division</div>
              <div class="info-value">${orphan.gnDivision || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">DS Division</div>
              <div class="info-value">${orphan.dsDivision || 'N/A'}</div>
            </div>
            ${orphan.latitude ? `
            <div class="info-item">
              <div class="info-label">Latitude</div>
              <div class="info-value">${orphan.latitude}</div>
            </div>
            ` : ''}
            ${orphan.longitude ? `
            <div class="info-item">
              <div class="info-label">Longitude</div>
              <div class="info-value">${orphan.longitude}</div>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Guardian & Contact Information -->
        <div class="section">
          <div class="section-title">Guardian & Contact Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Guardian Name</div>
              <div class="info-value">${orphan.guardianName || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Guardian NIC</div>
              <div class="info-value">${orphan.guardianNIC || 'N/A'}</div>
            </div>
            <div class="info-item full-width">
              <div class="info-label">Contact Number</div>
              <div class="info-value">${orphan.contactNumber || 'N/A'}</div>
            </div>
          </div>
        </div>

        <!-- Parent Information -->
        <div class="section">
          <div class="section-title">Parent Information</div>
          <div class="info-grid">
            <div class="info-item full-width">
              <div class="info-label">Orphan Type</div>
              <div class="info-value">${orphan.orphanType || 'N/A'}</div>
            </div>
          </div>

          ${(orphan.orphanType === 'Both Parents' || orphan.orphanType === 'Mother Only') ? `
            <h4 class="subsection-title">Mother Information</h4>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Mother's Name</div>
                <div class="info-value">${orphan.motherName || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Mother's NIC</div>
                <div class="info-value">${orphan.motherNIC || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Mother's Occupation</div>
                <div class="info-value">${orphan.motherOccupation || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Mother's Monthly Income</div>
                <div class="info-value">${orphan.motherMonthlyIncome || 'N/A'}</div>
              </div>
            </div>
            ${orphan.motherCauseOfDeath ? `
              <div class="death-details">
                <h4>Mother's Death Details</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Cause of Death</div>
                    <div class="info-value">${orphan.motherCauseOfDeath || 'N/A'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Date of Death</div>
                    <div class="info-value">${orphan.motherDateOfDeath || 'N/A'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Place of Death</div>
                    <div class="info-value">${orphan.motherPlaceOfDeath || 'N/A'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">DC Number</div>
                    <div class="info-value">${orphan.motherDCNo || 'N/A'}</div>
                  </div>
                </div>
              </div>
            ` : ''}
          ` : ''}

          <h4 class="subsection-title">Father Information</h4>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Father's Name</div>
              <div class="info-value">${orphan.fatherName || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Father's Previous Occupation</div>
              <div class="info-value">${orphan.fatherPreviousOccupation || 'N/A'}</div>
            </div>
          </div>
          ${orphan.fatherCauseOfDeath ? `
            <div class="death-details">
              <h4>Father's Death Details</h4>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Cause of Death</div>
                  <div class="info-value">${orphan.fatherCauseOfDeath || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Date of Death</div>
                  <div class="info-value">${orphan.fatherDateOfDeath || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Place of Death</div>
                  <div class="info-value">${orphan.fatherPlaceOfDeath || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">DC Number</div>
                  <div class="info-value">${orphan.fatherDCNo || 'N/A'}</div>
                </div>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Education Information -->
        <div class="section">
          <div class="section-title">Education Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Education Level</div>
              <div class="info-value">${orphan.educationLevel || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">School Name</div>
              <div class="info-value">${orphan.schoolName || 'N/A'}</div>
            </div>
            <div class="info-item full-width">
              <div class="info-label">School Address</div>
              <div class="info-value">${orphan.schoolAddress || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Current Grade</div>
              <div class="info-value">${orphan.currentGrade || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">School Contact</div>
              <div class="info-value">${orphan.schoolContact || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Academic Performance</div>
              <div class="info-value">${orphan.academicPerformance || 'N/A'}</div>
            </div>
            <div class="info-item full-width">
              <div class="info-label">Favourite Subjects</div>
              <div class="info-value">${orphan.favouriteSubjects || 'N/A'}</div>
            </div>
            <div class="info-item full-width">
              <div class="info-label">Child's Dream/Ambition</div>
              <div class="info-value">${orphan.childDreamAmbition || 'N/A'}</div>
            </div>
          </div>
        </div>

        <!-- Social & Living Conditions -->
        <div class="section">
          <div class="section-title">Social & Living Conditions</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Level of Life</div>
              <div class="info-value">${orphan.levelOfLife || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">House Type</div>
              <div class="info-value">${orphan.houseType || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">House Status</div>
              <div class="info-value">${orphan.houseStatus || 'N/A'}</div>
            </div>
            <div class="info-item full-width">
              <div class="info-label">Social Concerns</div>
              <div class="info-value">${orphan.socialConcerns || 'N/A'}</div>
            </div>
          </div>
        </div>

        <!-- Health Information -->
        <div class="section">
          <div class="section-title">Health Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">General Health Status</div>
              <div class="info-value">${orphan.generalHealthStatus || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Existing Illness</div>
              <div class="info-value">${orphan.existingIllness || 'None'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Treatment Cost</div>
              <div class="info-value">${orphan.treatmentCost || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Treatment Payer</div>
              <div class="info-value">${orphan.treatmentPayer || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Has Disabilities</div>
              <div class="info-value">${orphan.hasDisabilities || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Disability Details</div>
              <div class="info-value">${orphan.disabilityDetails || 'None'}</div>
            </div>
            <div class="info-item full-width">
              <div class="info-label">Immunization Status</div>
              <div class="info-value">${orphan.immunizationStatus || 'N/A'}</div>
            </div>
          </div>
        </div>

          <!-- Footer -->
          <div class="footer">
            <div class="footer-title">GERSL - Global Education and Relief Services Lanka</div>
            <div class="footer-subtitle">Orphan Care Management System</div>
            <div class="footer-note">This is a computer-generated document. Document attachments are not included in this print.</div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleDownloadPDF = () => {
    // Use the print functionality to save as PDF
    // Modern browsers allow "Save as PDF" from print dialog
    const printWindow = window.open('', '_blank');
    const printContent = generatePrintableProfile(orphan);

    printWindow.document.write(printContent);
    printWindow.document.close();

    // Provide instruction for PDF saving
    printWindow.onload = () => {
      // Show alert with PDF save instruction
      setTimeout(() => {
        alert('Use your browser\'s Print dialog to save as PDF.\n\n1. Select "Save as PDF" as the destination\n2. Click Save\n3. Choose location and save the file');
        printWindow.print();
      }, 500);
    };
  };

  const handleSupportRegister = () => {
    // Switch to Support Log tab to view support register
    setActiveTab('support');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-600 text-white p-6 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              {profilePhotoUrl ? (
                <img
                  src={profilePhotoUrl}
                  alt={orphan.fullName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="w-16 h-16 bg-white text-pink-600 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg"
                style={{ display: profilePhotoUrl ? 'none' : 'flex' }}
              >
                {photoInitial}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{orphan.fullName}</h2>
                <p className="text-pink-100">ID: {orphan.orphanId} • {orphan.age} years old • {orphan.status}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-pink-600 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-50 border-b border-gray-200 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex-shrink-0 z-10">
          <div className="flex min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={(e) => {
                    setActiveTab(tab.id);
                    // Scroll the clicked tab into view
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                  }}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold transition-all border-b-2 whitespace-nowrap flex-shrink-0 min-w-fit ${
                    activeTab === tab.id
                      ? 'border-pink-500 text-pink-600 bg-white'
                      : 'border-transparent text-gray-600 hover:text-pink-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'personal' && <PersonalInfoTab orphan={orphan} />}
          {activeTab === 'location' && <LocationTab orphan={orphan} />}
          {activeTab === 'education' && <EducationTab orphan={orphan} />}
          {activeTab === 'social' && <SocialTab orphan={orphan} />}
          {activeTab === 'health' && <HealthTab orphan={orphan} />}
          {activeTab === 'documents' && <DocumentsTab orphan={orphan} />}
          {activeTab === 'visits' && <VisitsTab orphan={orphan} />}
          {activeTab === 'reports' && <ReportsTab orphan={orphan} />}
          {activeTab === 'support' && <SupportLogTab orphan={orphan} onAssignPartner={handleAssignDonor} />}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {hasPermission('orphans:assign_coordinator') && (
              <button
                onClick={handleAssignCoordinator}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs font-semibold shadow-sm hover:shadow-md"
              >
                <UserPlus size={16} />
                <span className="hidden sm:inline">Assign Coordinator</span>
                <span className="sm:hidden">Coordinator</span>
              </button>
            )}
            {hasPermission('orphans:assign_coordinator') && (
              <button
                onClick={handleAssignDonor}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-xs font-semibold shadow-sm hover:shadow-md"
              >
                <DollarSign size={16} />
                <span className="hidden sm:inline">Assign Partner</span>
                <span className="sm:hidden">Partner</span>
              </button>
            )}
            <button
              onClick={handleSupportRegister}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition text-xs font-semibold shadow-sm hover:shadow-md"
            >
              <BookOpen size={16} />
              <span className="hidden sm:inline">Support Register</span>
              <span className="sm:hidden">Support</span>
            </button>
            <button
              onClick={handlePrintProfile}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-xs font-semibold shadow-sm hover:shadow-md"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">Print Profile</span>
              <span className="sm:hidden">Print</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-xs font-semibold shadow-sm hover:shadow-md"
            >
              <FileDown size={16} />
              <span className="hidden sm:inline">Profile PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
            <button
              onClick={onClose}
              className="col-span-2 md:col-span-3 lg:col-span-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AssignCoordinatorModal
        isOpen={showCoordinatorModal}
        onClose={() => setShowCoordinatorModal(false)}
        orphan={orphan}
        onAssign={handleCoordinatorAssign}
      />

      <AssignDonorModal
        isOpen={showDonorModal}
        onClose={() => setShowDonorModal(false)}
        orphan={orphan}
        onAssign={handleDonorAssign}
      />
    </div>
  );
};

// Personal Information Tab
const PersonalInfoTab = ({ orphan }) => (
  <div className="space-y-6">
    {/* Personal Information */}
    <div>
      <SectionHeader icon={User} title="Personal Information" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InfoField label="Orphan ID" value={orphan.orphanId} icon={Hash} />
        <InfoField label="Full Name" value={orphan.fullName} icon={User} />
        <InfoField label="Date of Birth" value={orphan.dateOfBirth} icon={Calendar} />
        <InfoField label="Age" value={`${orphan.age} years`} icon={Calendar} />
      </div>
    </div>

    {/* Guardian & Contact Information */}
    <div>
      <SectionHeader icon={Phone} title="Guardian & Contact Information" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InfoField label="Guardian Name" value={orphan.guardianName} icon={User} />
        <InfoField label="Guardian NIC" value={orphan.guardianNIC} icon={FileText} />
        <InfoField label="Contact Number" value={orphan.contactNumber} icon={Phone} />
      </div>
    </div>

    {/* Parent Information */}
    <div>
      <SectionHeader icon={Users} title="Parent Information" />

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm font-semibold text-blue-900 mb-1">Orphan Type</p>
        <p className="text-blue-700">{orphan.orphanType}</p>
      </div>

      {/* Mother Information */}
      {(orphan.orphanType === 'Both Parents' || orphan.orphanType === 'Mother Only') && (
        <div className="mt-4">
          <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2 mb-4">
            <Users size={20} className="text-pink-500" />
            Mother Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField label="Mother's Name" value={orphan.motherName} />
            <InfoField label="Mother's NIC" value={orphan.motherNIC} />
            <InfoField label="Mother's Occupation" value={orphan.motherOccupation} />
            <InfoField label="Mother's Monthly Income" value={orphan.motherMonthlyIncome} />
          </div>
          {orphan.motherCauseOfDeath && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 mt-4">
              <p className="font-semibold text-red-900 mb-3">Mother's Death Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label="Cause of Death" value={orphan.motherCauseOfDeath} />
                <InfoField label="Date of Death" value={orphan.motherDateOfDeath} />
                <InfoField label="Place of Death" value={orphan.motherPlaceOfDeath} />
                <InfoField label="DC Number" value={orphan.motherDCNo} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Father Information */}
      <div className="mt-4">
        <h4 className="font-semibold text-gray-900 text-lg flex items-center gap-2 mb-4">
          <Users size={20} className="text-blue-500" />
          Father Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoField label="Father's Name" value={orphan.fatherName} />
          <InfoField label="Father's Previous Occupation" value={orphan.fatherPreviousOccupation} />
        </div>
        {orphan.fatherCauseOfDeath && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 mt-4">
            <p className="font-semibold text-red-900 mb-3">Father's Death Details</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Cause of Death" value={orphan.fatherCauseOfDeath} />
              <InfoField label="Date of Death" value={orphan.fatherDateOfDeath} />
              <InfoField label="Place of Death" value={orphan.fatherPlaceOfDeath} />
              <InfoField label="DC Number" value={orphan.fatherDCNo} />
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Assigned Coordinator */}
    {orphan.assignedCoordinator && (
      <div className="mt-6">
        <SectionHeader icon={UserPlus} title="Assigned Coordinator" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          <InfoField label="Name" value={orphan.assignedCoordinator.name} icon={User} />
          <InfoField label="Position" value={orphan.assignedCoordinator.position} icon={User} />
          <InfoField label="District" value={orphan.assignedCoordinator.district} icon={MapPin} />
          <InfoField label="Email" value={orphan.assignedCoordinator.email} icon={Phone} />
          <InfoField label="Phone" value={orphan.assignedCoordinator.phone} icon={Phone} />
        </div>
      </div>
    )}

    {/* Assigned Partners */}
    {orphan.assignedPartners && orphan.assignedPartners.length > 0 && (
      <div className="mt-6">
        <SectionHeader icon={DollarSign} title={`Assigned Partners (${orphan.assignedPartners.length})`} />
        <div className="space-y-4 mt-4">
          {orphan.assignedPartners.map((assignment, index) => (
            <div key={index} className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <Building2 size={18} className="text-green-600" />
                  {assignment.partner.name}
                </h4>
                <span className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full">
                  {assignment.supportType}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <InfoField label="Partner Type" value={assignment.partner.type} icon={Building2} />
                <InfoField label="Country" value={assignment.partner.country} icon={MapPin} />
                <InfoField label="Project" value={assignment.project.name} icon={Briefcase} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Legacy single assignedDonor support */}
    {orphan.assignedDonor && (!orphan.assignedPartners || orphan.assignedPartners.length === 0) && (
      <div className="mt-6">
        <SectionHeader icon={DollarSign} title="Assigned Partner" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          <InfoField label="Name" value={orphan.assignedDonor.name} icon={User} />
          <InfoField label="Type" value={orphan.assignedDonor.type} icon={User} />
          <InfoField label="Country" value={orphan.assignedDonor.country} icon={MapPin} />
          <InfoField label="Email" value={orphan.assignedDonor.email} icon={Phone} />
          <InfoField label="Phone" value={orphan.assignedDonor.phone} icon={Phone} />
          <InfoField label="Monthly Support" value={`LKR ${orphan.assignedDonor.monthlyAmount?.toLocaleString()}`} icon={DollarSign} />
        </div>
      </div>
    )}
  </div>
);

// Location Information Tab
const LocationTab = ({ orphan }) => (
  <div className="space-y-6">
    <SectionHeader icon={MapPin} title="Location Information" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <InfoField label="District" value={orphan.district} icon={MapPin} />
      <InfoField label="Address" value={orphan.address} icon={MapPin} />
      <InfoField label="GN Division" value={orphan.gnDivision} icon={MapPin} />
      <InfoField label="DS Division" value={orphan.dsDivision} icon={MapPin} />
      <InfoField label="Latitude" value={orphan.latitude} icon={MapPin} />
      <InfoField label="Longitude" value={orphan.longitude} icon={MapPin} />
    </div>
  </div>
);

// Education Information Tab
const EducationTab = ({ orphan }) => (
  <div className="space-y-6">
    <SectionHeader icon={GraduationCap} title="Education Information" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <InfoField label="Education Level" value={orphan.educationLevel} icon={GraduationCap} />
      <InfoField label="School Name" value={orphan.schoolName} icon={GraduationCap} />
      <InfoField label="School Address" value={orphan.schoolAddress} icon={MapPin} />
      <InfoField label="Current Grade" value={orphan.currentGrade} icon={FileText} />
      <InfoField label="School Contact" value={orphan.schoolContact} icon={Phone} />
      <InfoField label="Academic Performance" value={orphan.academicPerformance} icon={Activity} />
      <InfoField label="Favourite Subjects" value={orphan.favouriteSubjects} icon={Heart} />
      <InfoField label="Child's Dream/Ambition" value={orphan.childDreamAmbition} icon={Heart} />
    </div>
  </div>
);

// Social & Living Conditions Tab
const SocialTab = ({ orphan }) => (
  <div className="space-y-6">
    <SectionHeader icon={Home} title="Social & Living Conditions" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <InfoField label="Level of Life" value={orphan.levelOfLife} icon={Activity} />
      <InfoField label="House Type" value={orphan.houseType} icon={Home} />
      <InfoField label="House Status" value={orphan.houseStatus} icon={Home} />
      <InfoField label="Social Concerns" value={orphan.socialConcerns} icon={FileText} fullWidth />
    </div>
  </div>
);

// Health Information Tab
const HealthTab = ({ orphan }) => (
  <div className="space-y-6">
    <SectionHeader icon={Stethoscope} title="Health Information" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <InfoField label="General Health Status" value={orphan.generalHealthStatus} icon={Heart} />
      <InfoField label="Existing Illness" value={orphan.existingIllness} icon={Stethoscope} />
      <InfoField label="Treatment Cost" value={orphan.treatmentCost} icon={FileText} />
      <InfoField label="Treatment Payer" value={orphan.treatmentPayer} icon={User} />
      <InfoField label="Has Disabilities" value={orphan.hasDisabilities} icon={Stethoscope} />
      <InfoField label="Disability Details" value={orphan.disabilityDetails} icon={FileText} />
      <InfoField label="Immunization Status" value={orphan.immunizationStatus} icon={Activity} />
    </div>
  </div>
);

// Documents Tab
const DocumentsTab = ({ orphan }) => {
  // Helper function to parse documents JSON
  const getDocuments = () => {
    try {
      if (orphan.documents) {
        const docs = typeof orphan.documents === 'string' ? JSON.parse(orphan.documents) : orphan.documents;
        if (Array.isArray(docs)) {
          return docs;
        }
      }
    } catch (error) {
      console.error('Error parsing documents:', error);
    }
    return [];
  };

  // Helper function to get document type label
  const getDocumentTypeLabel = (type) => {
    const labels = {
      'birthCertificate': 'Birth Certificate',
      'deathCertificate': 'Death Certificate',
      'guardianNICDoc': 'Guardian NIC Document',
      'schoolLetter': 'School Letter',
      'drawingLetter': 'Drawing Letter',
      'otherDoc1': 'Other Document 1',
      'otherDoc2': 'Other Document 2'
    };
    return labels[type] || 'Document';
  };

  // Helper function to get document icon based on filename
  const getDocumentIcon = (filename) => {
    if (filename.toLowerCase().endsWith('.pdf')) return FileText;
    if (filename.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)) return Upload;
    return FileDown;
  };

  // Helper function to get file extension
  const getFileExtension = (filename) => {
    const ext = filename.split('.').pop().toUpperCase();
    return ext;
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const documents = getDocuments();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Helper function to handle document download/view
  const handleDocumentClick = (docUrl) => {
    const fullUrl = `${API_URL}${docUrl}`;
    window.open(fullUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <SectionHeader icon={FolderOpen} title="Uploaded Documents" />

      {documents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <FolderOpen size={48} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500 font-medium">No documents uploaded yet</p>
          <p className="text-gray-400 text-sm mt-1">Documents uploaded during orphan registration will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc, index) => {
            const DocIcon = getDocumentIcon(doc.filename || doc.url);
            const typeLabel = getDocumentTypeLabel(doc.type);
            const fileExt = getFileExtension(doc.filename || doc.url);

            return (
              <div
                key={index}
                onClick={() => handleDocumentClick(doc.url)}
                className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                    <DocIcon size={24} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{typeLabel}</h4>
                    <p className="text-xs text-gray-500 mt-1 truncate">{doc.filename}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      <span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-gray-600 font-medium">
                        {fileExt}
                      </span>
                      <span className="ml-2">• {formatDate(doc.uploadedAt)}</span>
                    </p>
                  </div>
                  <FileDown size={18} className="text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button className="text-xs text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                    View/Download
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Support Log Tab
const SupportLogTab = ({ orphan, onAssignPartner }) => {
  // Get partner-wise support data
  const partnerSupports = orphan.assignedPartners || [];

  // State for selected partner
  const [selectedPartnerIndex, setSelectedPartnerIndex] = React.useState(0);

  // Sample support entries per partner - this should come from context in production
  const getSupportEntriesForPartner = (partnerId) => {
    // This would fetch from context/API in production
    return orphan.supportEntries?.filter(entry => entry.partnerId === partnerId) || [
      {
        id: 1,
        date: '2025-01-15',
        type: 'Financial',
        category: 'Monthly Stipend',
        amount: 5000,
        description: 'Monthly education stipend for January 2025',
        status: 'Completed',
        receiptNo: 'RCP-2025-001'
      },
      {
        id: 2,
        date: '2025-02-15',
        type: 'Financial',
        category: 'Monthly Stipend',
        amount: 5000,
        description: 'Monthly education stipend for February 2025',
        status: 'Completed',
        receiptNo: 'RCP-2025-002'
      },
      {
        id: 3,
        date: '2025-03-15',
        type: 'Financial',
        category: 'Monthly Stipend',
        amount: 5000,
        description: 'Monthly education stipend for March 2025',
        status: 'Completed',
        receiptNo: 'RCP-2025-003'
      }
    ];
  };

  // Get currently selected partner
  const selectedPartner = partnerSupports[selectedPartnerIndex];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Delivered': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Processing': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (partnerSupports.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-900 font-semibold mb-2">No partners assigned yet</p>
        <p className="text-gray-500 text-sm">Use the <span className="font-bold text-green-600">"Assign Partner"</span> button below to get started</p>
      </div>
    );
  }

  const supportEntries = getSupportEntriesForPartner(selectedPartner.partner.id);
  const totalAmount = supportEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Partner Selector */}
      {partnerSupports.length > 1 && (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
            <Building2 size={16} className="text-green-600" />
            Select Partner to View Support Records
          </label>
          <div className="relative">
            <select
              value={selectedPartnerIndex}
              onChange={(e) => setSelectedPartnerIndex(parseInt(e.target.value))}
              className="w-full px-4 py-3 pr-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none appearance-none bg-white text-gray-900 font-semibold"
            >
              {partnerSupports.map((assignment, index) => (
                <option key={index} value={index}>
                  {assignment.partner.name} - {assignment.supportType} ({assignment.project.name})
                </option>
              ))}
            </select>
            <svg
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-gray-600">Viewing {selectedPartnerIndex + 1} of {partnerSupports.length} partners</span>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                {supportEntries.length} Records
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                LKR {totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Selected Partner Display */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden">
        {/* Partner Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white text-green-600 rounded-xl flex items-center justify-center text-2xl font-bold flex-shrink-0 shadow-lg">
                {selectedPartner.partner.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1">{selectedPartner.partner.name}</h3>
                <div className="flex items-center gap-3 text-green-100 text-sm">
                  <span className="flex items-center gap-1">
                    <Building2 size={14} />
                    {selectedPartner.partner.type}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {selectedPartner.partner.country}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="px-4 py-1.5 bg-white/20 rounded-lg text-sm font-bold mb-2">
                {selectedPartner.supportType}
              </span>
              <p className="text-green-100 text-xs">
                Project: {selectedPartner.project.name}
              </p>
            </div>
          </div>
        </div>

        {/* Support Summary */}
        <div className="bg-green-50 border-b border-green-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-600 text-white rounded-lg flex items-center justify-center">
                <DollarSign size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Support</p>
                <p className="text-lg font-bold text-gray-900">LKR {totalAmount.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center">
                <Package size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Records</p>
                <p className="text-lg font-bold text-gray-900">{supportEntries.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-600 text-white rounded-lg flex items-center justify-center">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-600">Assigned Date</p>
                <p className="text-lg font-bold text-gray-900">{selectedPartner.assignedDate || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Support Entries */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Package size={18} />
              Support Records
            </h4>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold shadow-md">
              Add Support Entry
            </button>
          </div>

          {supportEntries.length > 0 ? (
            <div className="space-y-3">
              {supportEntries.map((entry) => (
                <div key={entry.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(entry.status)}`}>
                          {entry.status}
                        </span>
                        <span className="text-xs text-gray-500">#{entry.receiptNo}</span>
                      </div>
                      <h5 className="font-bold text-gray-900 mb-1">{entry.category}</h5>
                      <p className="text-sm text-gray-600 mb-2">{entry.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar size={12} />
                        <span>{entry.date}</span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-lg text-right min-w-[140px]">
                      <p className="text-xs font-semibold opacity-90 mb-1">Amount</p>
                      <p className="text-xl font-bold">LKR {entry.amount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <Package className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 text-sm mb-3">No support entries yet for this partner</p>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold">
                Add First Entry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper Components
const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-3 pb-3 border-b-2 border-pink-200">
    <div className="bg-pink-100 p-2 rounded-lg">
      <Icon className="w-5 h-5 text-pink-600" />
    </div>
    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
  </div>
);

const InfoField = ({ label, value, icon: Icon, fullWidth = false }) => (
  <div className={`${fullWidth ? 'md:col-span-2' : ''}`}>
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon size={16} className="text-pink-500" />}
        <p className="text-xs font-semibold text-gray-500 uppercase">{label}</p>
      </div>
      <p className="text-sm font-semibold text-gray-900">{value || 'Not provided'}</p>
    </div>
  </div>
);

export default OrphanProfile;
