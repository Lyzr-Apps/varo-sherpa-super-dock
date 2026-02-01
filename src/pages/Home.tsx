import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Phone,
  Camera,
  CheckCircle,
  AlertCircle,
  Shield,
  DollarSign,
  Download,
  Mail,
  CreditCard,
  Users,
  Gift,
  Home as HomeIcon,
  Loader2,
  ChevronRight,
  ChevronDown,
  PlayCircle,
  FileText,
  Zap,
  TrendingUp,
  Building,
  Smartphone
} from 'lucide-react'
import { callAIAgent } from '@/utils/aiAgent'
import type { NormalizedAgentResponse } from '@/utils/aiAgent'

// Agent IDs
const AGENT_IDS = {
  ORCHESTRATOR: '697ea6d9d36f070193f5def1',
  ID_SHERPA: '697ea656066158e77fde64b4',
  COMPLIANCE: '697ea672066158e77fde64b5',
  LOCK_RESOLUTION: '697ea690d36f070193f5deef',
  FUNDING_ARCHITECT: '697ea6aed36f070193f5def0'
}

// TypeScript interfaces from actual response schemas
interface IDSherpaResult {
  quality_assessment: {
    overall_score: number
    issues_detected: string[]
    pass: boolean
  }
  corrective_guidance: string[]
  liveness_check: {
    positioning_valid: boolean
    face_detected: boolean
    confidence: number
  }
  authenticity_indicators: {
    document_type: string
    security_features_detected: string[]
    confidence: number
  }
}

interface ComplianceResult {
  investigation_summary: {
    case_id: string
    applicant_risk_score: number
    recommendation: string
    confidence: number
  }
  alternative_data_findings: {
    telco_verification: {
      account_age_months: number
      payment_history: string
      verified: boolean
    }
    utility_verification: {
      service_types: string[]
      payment_reliability: number
      verified: boolean
    }
    geolocation_verification: {
      address_match: boolean
      stability_months: number
      verified: boolean
    }
    chexsystems_check: {
      reports_found: number
      negative_indicators: boolean
    }
  }
  reasoning_chain: string[]
}

interface LockResolutionResult {
  unlock_decision: {
    case_id: string
    decision: string
    unlock_method: string
    confidence: number
  }
  verification_results: {
    video_selfie: {
      completed: boolean
      face_match_score: number
      liveness_confirmed: boolean
      passed: boolean
    }
    device_fingerprint: {
      device_id: string
      matches_history: boolean
      trusted_device: boolean
      last_seen: string
    }
    fraud_flag_review: {
      original_flag: string
      flag_type: string
      cleared: boolean
      reason: string
    }
  }
  security_assessment: {
    risk_level: string
    risk_score: number
    additional_challenges_required: boolean
    account_access_granted: boolean
  }
}

interface FundingArchitectResult {
  transaction_analysis: {
    total_deposits_analyzed: number
    income_pattern_detected: boolean
    primary_income_source: {
      employer_name: string
      employer_confidence: number
      average_deposit_amount: number
      pay_frequency: string
      next_expected_payday: string
    }
    additional_income_sources: Array<{
      source: string
      frequency: string
      average_amount: number
    }>
  }
  direct_deposit_form: {
    form_generated: boolean
    employer_name: string
    routing_number: string
    account_number: string
    account_type: string
    allocation_percentage: number
    prefill_confidence: number
    form_download_url: string
  }
  early_payday_benefit: {
    eligible: boolean
    estimated_days_early: number
    annual_benefit_value: number
    benefit_description: string
  }
  recommendations: string[]
}

interface OrchestratorResult {
  onboarding_decision: {
    approved: boolean
    confidence: number
    decision_rationale: string
    risk_level: string
  }
  verification_summary: {
    id_verification: {
      completed: boolean
      passed: boolean
      quality_score: number
      agent: string
    }
    compliance_check: {
      completed: boolean
      passed: boolean
      alternative_data_used: boolean
      agent: string
    }
    account_security: {
      completed: boolean
      no_flags: boolean
      agent: string
    }
  }
  reasoning_chain: string[]
  next_steps: string[]
}

type Screen =
  | 'welcome'
  | 'id-verification'
  | 'alternative-verification'
  | 'account-unlock'
  | 'approval'
  | 'direct-deposit'

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [idStep, setIdStep] = useState<'front' | 'back' | 'selfie'>('front')
  const [idSherpaResponse, setIdSherpaResponse] = useState<NormalizedAgentResponse | null>(null)
  const [complianceResponse, setComplianceResponse] = useState<NormalizedAgentResponse | null>(null)
  const [lockResponse, setLockResponse] = useState<NormalizedAgentResponse | null>(null)
  const [fundingResponse, setFundingResponse] = useState<NormalizedAgentResponse | null>(null)
  const [orchestratorResponse, setOrchestratorResponse] = useState<NormalizedAgentResponse | null>(null)
  const [showAccountNumber, setShowAccountNumber] = useState(false)
  const [selectedVerification, setSelectedVerification] = useState<string | null>(null)
  const [videoRecording, setVideoRecording] = useState(false)

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/)
    if (match) {
      const parts = [match[1], match[2], match[3]].filter(Boolean)
      return parts.join('-')
    }
    return value
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhoneNumber(formatted)
  }

  const handleContinueFromWelcome = () => {
    if (phoneNumber.replace(/\D/g, '').length === 10) {
      setCurrentScreen('id-verification')
    }
  }

  const handleCaptureID = async () => {
    setLoading(true)
    try {
      const result = await callAIAgent(
        `Verify ${idStep} of ID document`,
        AGENT_IDS.ID_SHERPA
      )

      if (result.success && result.response.status === 'success') {
        setIdSherpaResponse(result.response)

        if (idStep === 'front') {
          setIdStep('back')
        } else if (idStep === 'back') {
          setIdStep('selfie')
        } else {
          // Check if user needs alternative verification (thin file simulation)
          const needsAltVerification = Math.random() > 0.5
          if (needsAltVerification) {
            setCurrentScreen('alternative-verification')
          } else {
            setCurrentScreen('account-unlock')
          }
        }
      }
    } catch (error) {
      console.error('ID verification error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAlternativeVerification = async () => {
    if (!selectedVerification) return

    setLoading(true)
    try {
      const result = await callAIAgent(
        `Verify applicant using ${selectedVerification} data`,
        AGENT_IDS.COMPLIANCE
      )

      if (result.success && result.response.status === 'success') {
        setComplianceResponse(result.response)
        // Simulate account lock scenario
        const hasAccountLock = Math.random() > 0.6
        if (hasAccountLock) {
          setCurrentScreen('account-unlock')
        } else {
          await processOnboarding()
        }
      }
    } catch (error) {
      console.error('Compliance verification error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVideoChallenge = async () => {
    setVideoRecording(true)
    setLoading(true)

    // Simulate 3 second recording
    await new Promise(resolve => setTimeout(resolve, 3000))
    setVideoRecording(false)

    try {
      const result = await callAIAgent(
        'Verify user identity through video selfie challenge',
        AGENT_IDS.LOCK_RESOLUTION
      )

      if (result.success && result.response.status === 'success') {
        setLockResponse(result.response)
        await processOnboarding()
      }
    } catch (error) {
      console.error('Lock resolution error:', error)
    } finally {
      setLoading(false)
    }
  }

  const processOnboarding = async () => {
    setLoading(true)
    try {
      const result = await callAIAgent(
        'Process complete onboarding verification',
        AGENT_IDS.ORCHESTRATOR
      )

      if (result.success && result.response.status === 'success') {
        setOrchestratorResponse(result.response)
        setCurrentScreen('approval')
      }
    } catch (error) {
      console.error('Orchestrator error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSetupDirectDeposit = async () => {
    setLoading(true)
    try {
      const result = await callAIAgent(
        'Generate direct deposit form and analyze income patterns',
        AGENT_IDS.FUNDING_ARCHITECT
      )

      if (result.success && result.response.status === 'success') {
        setFundingResponse(result.response)
      }
    } catch (error) {
      console.error('Funding architect error:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen
          phoneNumber={phoneNumber}
          onPhoneChange={handlePhoneChange}
          onContinue={handleContinueFromWelcome}
        />

      case 'id-verification':
        return <IDVerificationScreen
          idStep={idStep}
          loading={loading}
          idSherpaResponse={idSherpaResponse}
          onCapture={handleCaptureID}
        />

      case 'alternative-verification':
        return <AlternativeVerificationScreen
          selectedVerification={selectedVerification}
          onSelectVerification={setSelectedVerification}
          onContinue={handleAlternativeVerification}
          loading={loading}
          complianceResponse={complianceResponse}
        />

      case 'account-unlock':
        return <AccountUnlockScreen
          videoRecording={videoRecording}
          loading={loading}
          lockResponse={lockResponse}
          onSubmitChallenge={handleVideoChallenge}
        />

      case 'approval':
        return <ApprovalScreen
          showAccountNumber={showAccountNumber}
          onToggleAccountNumber={() => setShowAccountNumber(!showAccountNumber)}
          onSetupDirectDeposit={() => setCurrentScreen('direct-deposit')}
          orchestratorResponse={orchestratorResponse}
        />

      case 'direct-deposit':
        return <DirectDepositScreen
          fundingResponse={fundingResponse}
          onSetupDirectDeposit={handleSetupDirectDeposit}
          loading={loading}
        />

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {renderScreen()}
    </div>
  )
}

// Screen Components
function WelcomeScreen({
  phoneNumber,
  onPhoneChange,
  onContinue
}: {
  phoneNumber: string
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onContinue: () => void
}) {
  return (
    <div className="flex flex-col min-h-screen p-6">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <div className="w-full bg-gradient-to-br from-teal-50 to-teal-100 rounded-3xl p-12 mb-8 flex items-center justify-center">
          <div className="text-center">
            <div className="w-32 h-32 bg-[#0A7B7B] rounded-full mx-auto mb-4 flex items-center justify-center">
              <Smartphone className="w-16 h-16 text-white" />
            </div>
            <p className="text-sm text-[#0A7B7B] font-medium">Banking Made Simple</p>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 text-center mb-3">
          Open Your Account in 3 Minutes
        </h1>
        <p className="text-lg text-gray-600 text-center mb-8">
          No fees. No minimum balance. Get started today.
        </p>

        <div className="w-full space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mobile Number
            </label>
            <Input
              type="tel"
              placeholder="555-123-4567"
              value={phoneNumber}
              onChange={onPhoneChange}
              className="h-14 text-lg"
              maxLength={12}
            />
          </div>

          <Button
            onClick={onContinue}
            disabled={phoneNumber.replace(/\D/g, '').length !== 10}
            className="w-full h-14 text-lg bg-[#0A7B7B] hover:bg-[#085f5f]"
          >
            Continue
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-6 justify-center text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-[#0A7B7B]" />
            <span>No monthly fees</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-[#0A7B7B]" />
            <span>No minimum balance</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-[#0A7B7B]" />
            <span>Get paid early</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center mt-6">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  )
}

function IDVerificationScreen({
  idStep,
  loading,
  idSherpaResponse,
  onCapture
}: {
  idStep: 'front' | 'back' | 'selfie'
  loading: boolean
  idSherpaResponse: NormalizedAgentResponse | null
  onCapture: () => void
}) {
  const stepLabels = {
    front: 'Front of ID',
    back: 'Back of ID',
    selfie: 'Selfie'
  }

  const stepProgress = {
    front: 33,
    back: 66,
    selfie: 100
  }

  const idSherpaResult = idSherpaResponse?.result as IDSherpaResult | undefined

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Verify Your Identity</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Step {idStep === 'front' ? 1 : idStep === 'back' ? 2 : 3} of 3</span>
              <span>{stepLabels[idStep]}</span>
            </div>
            <Progress value={stepProgress[idStep]} className="h-2" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full">
        <div className="flex-1 flex flex-col justify-center">
          <div className="relative bg-gray-900 rounded-2xl overflow-hidden mb-6" style={{ aspectRatio: '3/4' }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white p-6">
                <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-sm opacity-75">Camera viewfinder</p>
              </div>
            </div>

            {idStep !== 'selfie' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-4 border-white border-dashed rounded-2xl opacity-50"
                     style={{ width: '85%', height: '60%' }}>
                </div>
              </div>
            )}

            {idStep === 'selfie' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-4 border-white border-dashed rounded-full opacity-50"
                     style={{ width: '70%', height: '70%' }}>
                </div>
              </div>
            )}
          </div>

          {idSherpaResult && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[#FF6B5B]" />
                  AI Guidance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Quality Score</span>
                  <Badge variant={idSherpaResult.quality_assessment.pass ? 'default' : 'destructive'}>
                    {(idSherpaResult.quality_assessment.overall_score * 100).toFixed(0)}%
                  </Badge>
                </div>

                {idSherpaResult.quality_assessment.issues_detected.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Issues Detected:</p>
                    {idSherpaResult.quality_assessment.issues_detected.map((issue, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{issue}</span>
                      </div>
                    ))}
                  </div>
                )}

                {idSherpaResult.corrective_guidance.length > 0 && (
                  <div className="space-y-2 bg-blue-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-900">Suggestions:</p>
                    {idSherpaResult.corrective_guidance.map((guidance, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-blue-800">{guidance}</span>
                      </div>
                    ))}
                  </div>
                )}

                {idStep === 'selfie' && idSherpaResult.liveness_check && (
                  <div className="space-y-2 border-t pt-3">
                    <p className="text-sm font-medium text-gray-700">Liveness Check:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        {idSherpaResult.liveness_check.face_detected ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-gray-600">Face Detected</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {idSherpaResult.liveness_check.positioning_valid ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-gray-600">Position Valid</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Confidence</span>
                      <span className="font-medium text-gray-900">
                        {(idSherpaResult.liveness_check.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {idStep === 'front' && 'Position the front of your ID'}
              {idStep === 'back' && 'Position the back of your ID'}
              {idStep === 'selfie' && 'Center your face in the circle'}
            </h3>
            <p className="text-sm text-gray-600">
              {idStep === 'front' && 'Make sure all text is clearly visible'}
              {idStep === 'back' && 'Include the barcode if present'}
              {idStep === 'selfie' && 'Look directly at the camera'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={onCapture}
            disabled={loading}
            className="w-full h-14 text-lg bg-[#0A7B7B] hover:bg-[#085f5f]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Camera className="mr-2 h-5 w-5" />
                Capture
              </>
            )}
          </Button>

          <button className="w-full text-sm text-[#0A7B7B] font-medium">
            Having trouble? Upload manually
          </button>
        </div>
      </div>
    </div>
  )
}

function AlternativeVerificationScreen({
  selectedVerification,
  onSelectVerification,
  onContinue,
  loading,
  complianceResponse
}: {
  selectedVerification: string | null
  onSelectVerification: (option: string) => void
  onContinue: () => void
  loading: boolean
  complianceResponse: NormalizedAgentResponse | null
}) {
  const [showExplanation, setShowExplanation] = useState(false)

  const verificationOptions = [
    {
      id: 'uber',
      icon: Building,
      title: 'Link Uber/DoorDash Account',
      description: 'Connect your gig work account'
    },
    {
      id: 'utility',
      icon: Zap,
      title: 'Link Utility Account',
      description: 'Verify with electric or gas bill'
    },
    {
      id: 'statement',
      icon: FileText,
      title: 'Upload Bank Statement',
      description: 'From your current bank'
    }
  ]

  const complianceResult = complianceResponse?.result as ComplianceResult | undefined

  return (
    <div className="flex flex-col min-h-screen p-6">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            We Need a Bit More Info
          </h1>
          <p className="text-gray-600">
            To ensure your security and comply with banking regulations, we need to verify your identity with additional information.
          </p>
        </div>

        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Why Alternative Verification?</p>
                <p className="text-sm text-blue-800">
                  You have a limited credit history. We can verify your identity using alternative data sources like utility bills or gig work accounts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3 mb-6">
          <p className="text-sm font-medium text-gray-700">Choose a verification method:</p>
          {verificationOptions.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.id}
                onClick={() => onSelectVerification(option.id)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  selectedVerification === option.id
                    ? 'border-[#0A7B7B] bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    selectedVerification === option.id
                      ? 'bg-[#0A7B7B] text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{option.title}</h3>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                  {selectedVerification === option.id && (
                    <CheckCircle className="h-6 w-6 text-[#0A7B7B]" />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {complianceResult && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Verification Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-900">Risk Score</span>
                <Badge className="bg-green-600">
                  {(complianceResult.investigation_summary.applicant_risk_score * 100).toFixed(0)}%
                </Badge>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Alternative Data Verified:</p>

                {complianceResult.alternative_data_findings.telco_verification.verified && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">
                      Telco: {complianceResult.alternative_data_findings.telco_verification.account_age_months} months, {complianceResult.alternative_data_findings.telco_verification.payment_history}
                    </span>
                  </div>
                )}

                {complianceResult.alternative_data_findings.utility_verification.verified && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">
                      Utilities: {complianceResult.alternative_data_findings.utility_verification.service_types.join(', ')} ({(complianceResult.alternative_data_findings.utility_verification.payment_reliability * 100).toFixed(0)}% reliability)
                    </span>
                  </div>
                )}

                {complianceResult.alternative_data_findings.geolocation_verification.verified && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">
                      Address: {complianceResult.alternative_data_findings.geolocation_verification.stability_months} months stable
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t">
                <p className="text-sm font-medium text-gray-700 mb-2">AI Analysis:</p>
                <div className="space-y-1">
                  {complianceResult.reasoning_chain.slice(0, 3).map((reason, i) => (
                    <p key={i} className="text-sm text-gray-600 leading-relaxed">{reason}</p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="flex items-center gap-2 text-sm text-[#0A7B7B] font-medium mb-6"
        >
          {showExplanation ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Why do you need this?
        </button>

        {showExplanation && (
          <Card className="mb-6 border-gray-200">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 leading-relaxed">
                Federal regulations require us to verify the identity of all account holders. For customers with limited credit history, we use alternative data sources that demonstrate financial responsibility and identity verification.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="mt-auto">
          <Button
            onClick={onContinue}
            disabled={!selectedVerification || loading}
            className="w-full h-14 text-lg bg-[#0A7B7B] hover:bg-[#085f5f]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Verifying...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

function AccountUnlockScreen({
  videoRecording,
  loading,
  lockResponse,
  onSubmitChallenge
}: {
  videoRecording: boolean
  loading: boolean
  lockResponse: NormalizedAgentResponse | null
  onSubmitChallenge: () => void
}) {
  const challengePhrase = "The quick brown fox jumps over the lazy dog"
  const lockResult = lockResponse?.result as LockResolutionResult | undefined

  return (
    <div className="flex flex-col min-h-screen p-6">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">Account Temporarily Locked</h3>
                <p className="text-sm text-amber-800">
                  We detected activity from a new device. To protect your account, please complete this quick security challenge.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-[#0A7B7B]" />
              Video Challenge
            </CardTitle>
            <CardDescription>
              Record yourself saying the phrase below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-center text-lg font-medium text-gray-900 leading-relaxed">
                {challengePhrase}
              </p>
            </div>

            <div className="relative bg-gray-900 rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white p-6">
                  {videoRecording ? (
                    <>
                      <div className="w-16 h-16 mx-auto mb-4 border-4 border-red-500 rounded-full animate-pulse flex items-center justify-center">
                        <div className="w-8 h-8 bg-red-500 rounded-full"></div>
                      </div>
                      <p className="text-sm">Recording...</p>
                    </>
                  ) : (
                    <>
                      <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-sm opacity-75">Camera viewfinder</p>
                    </>
                  )}
                </div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-4 border-white border-dashed rounded-full opacity-30"
                     style={{ width: '70%', height: '70%' }}>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 text-sm text-gray-600">
              <Shield className="h-5 w-5 text-[#0A7B7B] flex-shrink-0 mt-0.5" />
              <p>
                This video is analyzed by AI to verify your identity and is then immediately deleted. It&apos;s never stored or shared.
              </p>
            </div>
          </CardContent>
        </Card>

        {lockResult && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="font-semibold text-green-900">
                  {lockResult.unlock_decision.decision === 'approved' ? 'Challenge Passed!' : 'Verification Complete'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Face Match</span>
                  <span className="font-medium text-gray-900">
                    {(lockResult.verification_results.video_selfie.face_match_score * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Liveness</span>
                  <Badge variant={lockResult.verification_results.video_selfie.liveness_confirmed ? 'default' : 'destructive'}>
                    {lockResult.verification_results.video_selfie.liveness_confirmed ? 'Confirmed' : 'Failed'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Risk Level</span>
                  <Badge className="bg-green-600">
                    {lockResult.security_assessment.risk_level}
                  </Badge>
                </div>
              </div>

              {lockResult.verification_results.fraud_flag_review.cleared && (
                <div className="pt-3 border-t border-green-200">
                  <p className="text-sm text-green-800">
                    <span className="font-medium">Note:</span> {lockResult.verification_results.fraud_flag_review.reason}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="mt-auto space-y-3">
          <Button
            onClick={onSubmitChallenge}
            disabled={loading || videoRecording}
            className="w-full h-14 text-lg bg-[#0A7B7B] hover:bg-[#085f5f]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Verifying...
              </>
            ) : videoRecording ? (
              <>
                <div className="w-5 h-5 mr-2 border-4 border-white rounded-full animate-pulse"></div>
                Recording...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-5 w-5" />
                Start Recording
              </>
            )}
          </Button>

          <button className="w-full text-sm text-[#0A7B7B] font-medium">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  )
}

function ApprovalScreen({
  showAccountNumber,
  onToggleAccountNumber,
  onSetupDirectDeposit,
  orchestratorResponse
}: {
  showAccountNumber: boolean
  onToggleAccountNumber: () => void
  onSetupDirectDeposit: () => void
  orchestratorResponse: NormalizedAgentResponse | null
}) {
  const accountNumber = '****4321'
  const routingNumber = '123456789'

  const orchestratorResult = orchestratorResponse?.result as OrchestratorResult | undefined

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <div className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full">
        <div className="text-center mb-8 pt-12">
          <div className="w-24 h-24 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Varo!</h1>
          <p className="text-lg text-gray-600">Your account is ready to use</p>
        </div>

        {orchestratorResult && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-900">Approval Status</span>
                <Badge className="bg-green-600">
                  {orchestratorResult.onboarding_decision.approved ? 'Approved' : 'Pending'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-800">Confidence</span>
                <span className="text-sm font-medium text-green-900">
                  {(orchestratorResult.onboarding_decision.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-800">Risk Level</span>
                <Badge variant="outline" className="border-green-600 text-green-700">
                  {orchestratorResult.onboarding_decision.risk_level}
                </Badge>
              </div>
              <Separator className="bg-green-200" />
              <p className="text-sm text-green-800">{orchestratorResult.onboarding_decision.decision_rationale}</p>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Your Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Account Number</span>
                <button
                  onClick={onToggleAccountNumber}
                  className="text-sm text-[#0A7B7B] font-medium"
                >
                  {showAccountNumber ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="font-mono text-lg font-semibold text-gray-900">
                {showAccountNumber ? '1234567890' : accountNumber}
              </p>
            </div>
            <Separator />
            <div>
              <span className="text-sm text-gray-600 block mb-2">Routing Number</span>
              <p className="font-mono text-lg font-semibold text-gray-900">{routingNumber}</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="mb-6 border-[#FF6B5B] bg-gradient-to-r from-[#FF6B5B] to-[#ff8577] text-white cursor-pointer hover:shadow-lg transition-shadow"
          onClick={onSetupDirectDeposit}
        >
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">Unlock Early Payday</h3>
                <p className="text-white/90 text-sm mb-3">
                  Get your paycheck up to 2 days early with Direct Deposit
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Set up now</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-[#0A7B7B] hover:bg-teal-50 transition-colors">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-[#0A7B7B]" />
            </div>
            <span className="text-xs font-medium text-gray-700">Add Money</span>
          </button>

          <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-[#0A7B7B] hover:bg-teal-50 transition-colors">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-[#0A7B7B]" />
            </div>
            <span className="text-xs font-medium text-gray-700">Get Card</span>
          </button>

          <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-[#0A7B7B] hover:bg-teal-50 transition-colors">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-[#0A7B7B]" />
            </div>
            <span className="text-xs font-medium text-gray-700">Invite Friends</span>
          </button>
        </div>

        {orchestratorResult?.next_steps && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {orchestratorResult.next_steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-[#0A7B7B] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{step}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-md mx-auto flex justify-around p-4">
          <button className="flex flex-col items-center gap-1 text-[#0A7B7B]">
            <HomeIcon className="h-6 w-6" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <CreditCard className="h-6 w-6" />
            <span className="text-xs font-medium">Card</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <TrendingUp className="h-6 w-6" />
            <span className="text-xs font-medium">Advance</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <Users className="h-6 w-6" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function DirectDepositScreen({
  fundingResponse,
  onSetupDirectDeposit,
  loading
}: {
  fundingResponse: NormalizedAgentResponse | null
  onSetupDirectDeposit: () => void
  loading: boolean
}) {
  const fundingResult = fundingResponse?.result as FundingArchitectResult | undefined

  return (
    <div className="flex flex-col min-h-screen p-6">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Get Paid Early with Direct Deposit
          </h1>
          {fundingResult?.transaction_analysis.primary_income_source && (
            <p className="text-lg text-gray-600">
              Set up with <span className="font-semibold text-gray-900">
                {fundingResult.transaction_analysis.primary_income_source.employer_name}
              </span>
            </p>
          )}
        </div>

        {!fundingResult ? (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <Button
                onClick={onSetupDirectDeposit}
                disabled={loading}
                className="w-full bg-[#0A7B7B] hover:bg-[#085f5f]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze My Income'
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-6 border-[#FF6B5B] bg-gradient-to-br from-orange-50 to-pink-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gift className="h-5 w-5 text-[#FF6B5B]" />
                  Your Early Payday Benefit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-[#FF6B5B] mb-1">
                      {fundingResult.early_payday_benefit.estimated_days_early}
                    </p>
                    <p className="text-sm text-gray-600">Days Early</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-[#FF6B5B] mb-1">
                      ${fundingResult.early_payday_benefit.annual_benefit_value}
                    </p>
                    <p className="text-sm text-gray-600">Annual Value</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700">
                  {fundingResult.early_payday_benefit.benefit_description}
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Income Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-teal-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Employer</span>
                    <span className="font-semibold text-gray-900">
                      {fundingResult.transaction_analysis.primary_income_source.employer_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Average Deposit</span>
                    <span className="font-semibold text-gray-900">
                      ${fundingResult.transaction_analysis.primary_income_source.average_deposit_amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Pay Frequency</span>
                    <Badge className="bg-[#0A7B7B]">
                      {fundingResult.transaction_analysis.primary_income_source.pay_frequency}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Next Payday</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(fundingResult.transaction_analysis.primary_income_source.next_expected_payday).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Deposits Analyzed</span>
                  <span className="font-medium text-gray-900">
                    {fundingResult.transaction_analysis.total_deposits_analyzed}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Employer Confidence</span>
                  <span className="font-medium text-gray-900">
                    {(fundingResult.transaction_analysis.primary_income_source.employer_confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Pre-filled Direct Deposit Form</CardTitle>
                <CardDescription>Ready to download and submit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white rounded-lg p-4 border-2 border-dashed border-gray-300">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gray-100 rounded">
                      <FileText className="h-8 w-8 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-1">Direct_Deposit_Form.pdf</p>
                      <p className="text-sm text-gray-600">
                        Account: {fundingResult.direct_deposit_form.account_number}
                      </p>
                      <p className="text-sm text-gray-600">
                        Routing: {fundingResult.direct_deposit_form.routing_number}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button className="bg-[#0A7B7B] hover:bg-[#085f5f]">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="outline" className="border-[#0A7B7B] text-[#0A7B7B]">
                    <Mail className="mr-2 h-4 w-4" />
                    Email to HR
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Setup Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-[#0A7B7B] text-white flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 mb-1">Download the Form</p>
                      <p className="text-sm text-gray-600">Your account details are pre-filled</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-[#0A7B7B] text-white flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 mb-1">Submit to Your Employer</p>
                      <p className="text-sm text-gray-600">Give it to HR or payroll department</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-[#0A7B7B] text-white flex items-center justify-center text-sm font-bold">
                        3
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 mb-1">Get Paid Early</p>
                      <p className="text-sm text-gray-600">Receive deposits up to 2 days early</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {fundingResult.recommendations.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-5 w-5 text-[#FF6B5B]" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {fundingResult.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-[#0A7B7B] mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <div className="mt-auto">
          <Button
            variant="outline"
            className="w-full border-gray-300 text-gray-700"
          >
            I&apos;ll Do This Later
          </Button>
        </div>
      </div>
    </div>
  )
}
