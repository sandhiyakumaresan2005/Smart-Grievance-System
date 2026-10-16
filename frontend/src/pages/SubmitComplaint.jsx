import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  Send, AlertTriangle, ArrowLeft, Brain, Sparkles, FileText, CheckCircle2, Users, ThumbsUp
} from 'lucide-react';

const categories = [
  'Academic',
  'Hostel',
  'Transport',
  'Infrastructure',
  'Internet/Wi-Fi',
  'Harassment',
  'Ragging',
  'Safety',
  'Canteen Dish Issue',
  'Other'
];

const getTargetDepartment = (cat) => {
  switch (cat) {
    case 'Academic': return 'Academic Department';
    case 'Hostel': return 'Hostel Administration';
    case 'Transport': return 'Transport Department';
    case 'Internet/Wi-Fi': return 'IT Department';
    case 'Infrastructure': return 'Maintenance Department';
    case 'Harassment':
    case 'Ragging':
    case 'Safety': return 'Student Welfare / Anti-Ragging Committee';
    case 'Canteen Dish Issue': return 'Canteen & Hospitality';
    default: return 'General Administration';
  }
};

const SubmitComplaint = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Academic');
  const [locationName, setLocationName] = useState('');
  const [attachment, setAttachment] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  
  // Canteen Dish Issue Specific State
  const [canteenLocation, setCanteenLocation] = useState('Block A Canteen');
  const [dishName, setDishName] = useState('');
  const [issueType, setIssueType] = useState('QUALITY');
  const [mealTime, setMealTime] = useState('Lunch');
  const [dishPhoto, setDishPhoto] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('quick'); // 'quick' | 'guided'
  const navigate = useNavigate();
  const { addToast } = useToast();

  const updateFormData = (fields) => {
    if (fields.title !== undefined) setTitle(fields.title);
    if (fields.description !== undefined) setDescription(fields.description);
    if (fields.category !== undefined) setCategory(fields.category);
    if (fields.locationName !== undefined) setLocationName(fields.locationName);
    if (fields.attachment !== undefined) setAttachment(fields.attachment);
    if (fields.anonymous !== undefined) setAnonymous(fields.anonymous);
    if (fields.canteenLocation !== undefined) setCanteenLocation(fields.canteenLocation);
    if (fields.dishName !== undefined) setDishName(fields.dishName);
    if (fields.issueType !== undefined) setIssueType(fields.issueType);
    if (fields.mealTime !== undefined) setMealTime(fields.mealTime);
    if (fields.dishPhoto !== undefined) setDishPhoto(fields.dishPhoto);
  };

  // AI live preview state
  const [aiPreview, setAiPreview] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Novelty 3: Duplicate detection state
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [upvotingId, setUpvotingId] = useState(null);

  // Trigger AI preview and Duplicate Detection when description changes
  const triggerAIAnalysis = async () => {
    if (description.trim().length < 8) {
      setAiPreview(null);
      setDuplicateWarning(null);
      return;
    }
    
    setAiLoading(true);
    setCheckingDuplicates(true);
    try {
      const [aiRes, dupRes] = await Promise.allSettled([
        api.analyzeText(
          description, 
          undefined,
          category === 'Canteen Dish Issue' ? issueType : undefined
        ),
        api.checkDuplicate(title, description, category, locationName)
      ]);

      if (aiRes.status === 'fulfilled') {
        setAiPreview(aiRes.value);
      }
      if (dupRes.status === 'fulfilled' && dupRes.value?.hasDuplicate) {
        setDuplicateWarning(dupRes.value.matches || []);
      } else {
        setDuplicateWarning(null);
      }
    } catch (err) {
      console.warn('Analysis/Duplicate check error on preview:', err.message);
    } finally {
      setAiLoading(false);
      setCheckingDuplicates(false);
    }
  };

  const handleUpvoteDuplicate = async (complaintId) => {
    setUpvotingId(complaintId);
    try {
      const res = await api.upvoteComplaint(complaintId);
      addToast(res.message || 'Endorsed successfully! Tracking issue.', 'success');
      navigate('/student/complaints');
    } catch (err) {
      addToast(err.message || 'Could not endorse complaint', 'error');
    } finally {
      setUpvotingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !category) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = { 
        title, 
        description, 
        category, 
        location: locationName || 'Campus Premises', 
        attachment, 
        anonymous 
      };

      if (category === 'Canteen Dish Issue') {
        payload.canteenLocation = canteenLocation;
        payload.dishName = dishName;
        payload.issueType = issueType;
        payload.mealTime = mealTime;
        payload.dishPhoto = dishPhoto;
      }

      const result = await api.createComplaint(payload);
      addToast(`Grievance ${result.complaintId} submitted successfully!`, 'success');
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to submit grievance.');
      addToast('Submission failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadgeClass = (priority) => {
    return `badge badge-priority-${priority.toLowerCase()}`;
  };

  const getSentimentBadgeClass = (sentiment) => {
    return `badge badge-sentiment-${sentiment.toLowerCase()}`;
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <button 
          className="btn btn-outline" 
          onClick={() => navigate('/student/dashboard')}
          style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>
      </div>

      <div className="dashboard-header">
        <div>
          <h2>Submit Campus Grievance</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Fill in details. Our AI engine will automatically evaluate priority and route to the correct committee.</p>
        </div>
      </div>

      {error && (
        <div className="alert-box alert-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="detail-layout">
        {/* Form Column */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Grievance Form
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Complaint Title</label>
              <input
                type="text"
                id="title"
                className="form-control"
                placeholder="Brief summary of the issue (e.g. Wi-Fi down, canteen food quality issue)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Canteen Dish Issue Specific Fields */}
            {category === 'Canteen Dish Issue' && (
              <div style={{ 
                padding: '1.25rem', 
                background: 'rgba(234, 179, 8, 0.04)', 
                border: '1px solid rgba(234, 179, 8, 0.3)', 
                borderRadius: '8px', 
                marginBottom: '1.5rem' 
              }}>
                <h4 style={{ color: '#eab308', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                  <FileText size={18} /> Canteen & Food Quality Inspection Details
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem' }}>Canteen / Mess Location *</label>
                    <select
                      className="form-control"
                      value={canteenLocation}
                      onChange={(e) => setCanteenLocation(e.target.value)}
                      required={category === 'Canteen Dish Issue'}
                    >
                      <option value="Block A Canteen">Block A Main Canteen</option>
                      <option value="Block B Snacks Bar">Block B Snacks Bar</option>
                      <option value="Hostel Boys Mess">Hostel Boys Mess</option>
                      <option value="Hostel Girls Mess">Hostel Girls Mess</option>
                      <option value="Central Food Court">Central Food Court</option>
                      <option value="Library Cafe">Library Cafe</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem' }}>Dish / Food Item Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Chicken Biryani, Paneer Butter Masala, Tea"
                      value={dishName}
                      onChange={(e) => setDishName(e.target.value)}
                      required={category === 'Canteen Dish Issue'}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem' }}>Primary Issue Type *</label>
                    <select
                      className="form-control"
                      value={issueType}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setIssueType(newType);
                        if (description.length >= 10) {
                          api.analyzeText(description, undefined, newType).then(res => setAiPreview(res)).catch(() => {});
                        }
                      }}
                    >
                      <option value="QUALITY">Poor Quality / Taste</option>
                      <option value="HYGIENE">Hygiene / Sanitation Concern (HIGH Priority)</option>
                      <option value="FOREIGN_OBJECT">Foreign Object / Contamination (CRITICAL Priority)</option>
                      <option value="PRICING">Overpricing / Bill Discrepancy</option>
                      <option value="AVAILABILITY">Item Unavailable Despite Menu</option>
                      <option value="OTHER">Other Food Issue</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem' }}>Meal Time</label>
                    <select
                      className="form-control"
                      value={mealTime}
                      onChange={(e) => setMealTime(e.target.value)}
                    >
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Snacks">Snacks</option>
                      <option value="Dinner">Dinner</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem' }}>Dish Photo / Attachment Link</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. dish_photo.jpg or image URL"
                      value={dishPhoto}
                      onChange={(e) => setDishPhoto(e.target.value)}
                    />
                  </div>
                </div>

                {(issueType === 'FOREIGN_OBJECT' || issueType === 'HYGIENE') && (
                  <div style={{ marginTop: '0.5rem', padding: '0.65rem 0.85rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#f87171', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>🛡️ Health Safety Override Active: Food safety issues trigger automatic HIGH or CRITICAL priority escalation.</span>
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="location">Location / Building / Room No.</label>
              <input
                type="text"
                id="location"
                className="form-control"
                placeholder="e.g. Academic Block 1 / Room 204"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="attachment">Optional General Attachment</label>
              <input
                type="text"
                id="attachment"
                className="form-control"
                placeholder="e.g. error_screenshot.png or photo_evidence.jpg"
                value={attachment}
                onChange={(e) => setAttachment(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Detailed Description</label>
              <textarea
                id="description"
                className="form-control"
                rows="5"
                placeholder="Explain the grievance in detail. Mention specific delays (e.g. mentor signed but counsellor delayed, attendance not updated)."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={triggerAIAnalysis}
                required
              />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Tip: Press outside the text area to trigger live AI preview & duplicate checks.
              </p>
            </div>

            {/* Novelty 3: Real-Time Duplicate & Recurring-Issue Warning */}
            {checkingDuplicates && (
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>🔍 Checking for similar complaints in your department/hostel...</span>
              </div>
            )}

            {duplicateWarning && duplicateWarning.length > 0 && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '10px',
                padding: '1.2rem',
                marginBottom: '1.5rem',
                boxShadow: '0 4px 20px rgba(245, 158, 11, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#fbbf24', fontWeight: 700, marginBottom: '0.5rem' }}>
                  <AlertTriangle size={19} />
                  <span>Similar Grievance Already Reported</span>
                  <span style={{ fontSize: '0.7rem', background: 'rgba(245, 158, 11, 0.25)', color: '#fde68a', padding: '2px 8px', borderRadius: '12px', marginLeft: 'auto', fontWeight: 600 }}>
                    Novelty 3: Duplicate Clustering
                  </span>
                </div>
                <p style={{ fontSize: '0.84rem', color: '#cbd5e1', marginBottom: '0.9rem', lineHeight: '1.45' }}>
                  A similar issue has already been reported. You can <strong>endorse ("Me Too")</strong> the existing complaint to automatically boost its priority without creating duplicate queue clutter:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {duplicateWarning.map(dup => (
                    <div key={dup.id} style={{
                      background: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ flex: '1 1 240px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{dup.title}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>({dup.complaintId})</span>
                          <span style={{ fontSize: '0.7rem', padding: '1px 6px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderRadius: '4px', fontWeight: 600 }}>
                            {dup.similarity}% match
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          📍 {dup.location} • Status: <strong style={{ color: '#38bdf8' }}>{dup.status}</strong> • Endorsed by: <strong style={{ color: '#fbbf24' }}>{dup.affectedStudentCount} students</strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          fontSize: '0.8rem',
                          padding: '0.45rem 0.9rem',
                          background: dup.alreadyUpvoted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                          color: dup.alreadyUpvoted ? '#34d399' : '#38bdf8',
                          border: dup.alreadyUpvoted ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(56, 189, 248, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          cursor: dup.alreadyUpvoted ? 'default' : 'pointer'
                        }}
                        disabled={dup.alreadyUpvoted || upvotingId === dup.id}
                        onClick={() => handleUpvoteDuplicate(dup.id)}
                      >
                        <ThumbsUp size={14} />
                        {dup.alreadyUpvoted ? '✓ Already Endorsed' : (upvotingId === dup.id ? 'Endorsing...' : 'I Have This Too')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="checkbox-group">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                />
                <span>Submit Grievance Anonymously</span>
              </label>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '1.6rem', marginTop: '0.1rem' }}>
                If checked, your name and email will be hidden on administration portals.
              </p>
            </div>

            <button 
              type="submit" 
              className="btn btn-blue" 
              style={{ width: '100%', marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }} 
              disabled={loading}
            >
              <Send size={18} />
              {loading ? 'Submitting...' : 'Submit Grievance'}
            </button>
          </form>
        </div>

        {/* AI Preview Column */}
        <div className="detail-sidebar">
          <div className="glass-card" style={{ border: '1px solid rgba(59, 130, 246, 0.25)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--accent-cyan)' }}>
              <Sparkles size={18} />
            </div>

            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
              <Brain size={18} color="var(--accent-cyan)" /> Live AI Assessment
            </h3>

            {aiLoading ? (
              <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>Analyzing complaint text...</p>
              </div>
            ) : aiPreview ? (
              <div>
                <div className="detail-meta-item">
                  <div className="detail-meta-label">Calculated Priority</div>
                  <div className="detail-meta-val" style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={getPriorityBadgeClass(aiPreview.priority)}>{aiPreview.priority}</span>
                    {(aiPreview.isFoodSafetyOverride || (category === 'Canteen Dish Issue' && (issueType === 'FOREIGN_OBJECT' || issueType === 'HYGIENE'))) && (
                      <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '4px', fontWeight: 700 }}>
                        🛡️ Food Safety Priority Override
                      </span>
                    )}
                  </div>
                </div>

                <div className="detail-meta-item">
                  <div className="detail-meta-label">Urgency Score</div>
                  <div className="detail-meta-val" style={{ marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      <span>Severity weight:</span>
                      <span>{(aiPreview.score * 100).toFixed(0)}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${aiPreview.score * 100}%`, 
                          height: '100%', 
                          background: `linear-gradient(to right, var(--accent-blue), var(--priority-${aiPreview.priority.toLowerCase()}))`,
                          transition: 'width 0.4s ease'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="detail-meta-item">
                  <div className="detail-meta-label">Sentiment Polarized</div>
                  <div className="detail-meta-val" style={{ marginTop: '0.25rem' }}>
                    <span className={getSentimentBadgeClass(aiPreview.sentiment)}>{aiPreview.sentiment}</span>
                  </div>
                </div>

                <div className="detail-meta-item">
                  <div className="detail-meta-label">Automatic Department Routing</div>
                  <div className="detail-meta-val" style={{ color: 'var(--accent-cyan)', fontSize: '0.95rem', marginTop: '0.15rem' }}>
                    {getTargetDepartment(category)}
                  </div>
                </div>

                <div className="detail-meta-item" style={{ borderStyle: 'dashed' }}>
                  <div className="detail-meta-label">AI Logic Explanation</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: '1.4' }}>
                    {aiPreview.reason}
                  </p>
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <Brain size={36} style={{ opacity: 0.15, marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.85rem' }}>Type details in description and click outside to see live AI priority scoring & department routing.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Certificate Lightbox Modal - removed (OD feature deleted) */}
    </div>
  );
};

export default SubmitComplaint;
