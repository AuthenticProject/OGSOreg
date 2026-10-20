import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { HallOfFameHeader, type HallOfFameTab } from '../../components/hall-of-fame/HallOfFameHeader'
import { HallOfFameOverviewTab } from '../../components/hall-of-fame/HallOfFameOverviewTab'
import { HallOfFameStandingsTab } from '../../components/hall-of-fame/HallOfFameStandingsTab'
import { HallOfFameTrendsTab } from '../../components/hall-of-fame/HallOfFameTrendsTab'
import { HallOfFameAllTimeTab } from '../../components/hall-of-fame/HallOfFameAllTimeTab'
import { CampusProfileView } from '../../components/hall-of-fame/CampusProfileView'
import {
  hallOfFameService,
  slugToCampus,
} from '../../services/hallOfFameService'
import type { CompetitionPeriod } from '../../services/participantPeriodService'

export const HallOfFamePage: React.FC = () => {
  const { campusSlug: routeCampusSlug } = useParams<{ campusSlug?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  // Periods
  const [periods, setPeriods] = useState<CompetitionPeriod[]>([])
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('')

  // Active tab state
  const tabFromQuery = searchParams.get('tab') as HallOfFameTab | null
  const [activeTab, setActiveTab] = useState<HallOfFameTab>(
    routeCampusSlug ? 'profiles' : tabFromQuery || 'overview'
  )

  // Selected campus for Profile / Trends
  const [selectedCampusSlug, setSelectedCampusSlug] = useState<string>(
    routeCampusSlug || searchParams.get('campus') || 'gontor-1'
  )

  // Load eligible periods
  useEffect(() => {
    const eligible = hallOfFameService.getEligiblePeriods()
    setPeriods(eligible)
    if (eligible.length > 0 && !selectedPeriodId) {
      const periodFromQuery = searchParams.get('period')
      if (periodFromQuery && eligible.some((p) => p.id === periodFromQuery)) {
        setSelectedPeriodId(periodFromQuery)
      } else {
        setSelectedPeriodId(eligible[0].id)
      }
    }
  }, [selectedPeriodId, searchParams])

  // Sync route param changes
  useEffect(() => {
    if (routeCampusSlug) {
      setSelectedCampusSlug(routeCampusSlug)
      setActiveTab('profiles')
    } else if (tabFromQuery) {
      setActiveTab(tabFromQuery)
    }
  }, [routeCampusSlug, tabFromQuery])

  // Handle Tab Change
  const handleTabChange = (tab: HallOfFameTab) => {
    setActiveTab(tab)
    if (routeCampusSlug && tab !== 'profiles') {
      navigate(`/hall-of-fame?tab=${tab}`, { replace: true })
    } else {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', tab)
        return next
      })
    }
  }

  // Handle Selecting a Campus
  const handleSelectCampus = (campusSlug: string) => {
    setSelectedCampusSlug(campusSlug)
    setActiveTab('profiles')
    navigate(`/hall-of-fame/kampus/${campusSlug}`)
  }

  const selectedCampusName = slugToCampus(selectedCampusSlug)
  const overviewData = hallOfFameService.getHallOfFameOverview()

  return (
    <div className="w-full bg-[#F5F8F4] text-[#0C241B] py-10 lg:py-14 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Academic Header Banner */}
        <HallOfFameHeader
          activeTab={activeTab}
          onTabChange={handleTabChange}
          selectedCampusName={activeTab === 'profiles' ? String(selectedCampusName) : undefined}
        />

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <HallOfFameOverviewTab
            overviewData={overviewData}
            onNavigateToStandings={() => handleTabChange('standings')}
            onNavigateToAllTime={() => handleTabChange('all-time')}
            onSelectCampus={handleSelectCampus}
          />
        )}

        {/* Tab 2: Campus Standings */}
        {activeTab === 'standings' && (
          <HallOfFameStandingsTab
            periods={periods}
            selectedPeriodId={selectedPeriodId}
            onPeriodChange={setSelectedPeriodId}
            onSelectCampus={handleSelectCampus}
          />
        )}

        {/* Tab 3: Historical Trends */}
        {activeTab === 'trends' && (
          <HallOfFameTrendsTab
            initialCampus={String(selectedCampusName)}
            onSelectCampus={handleSelectCampus}
          />
        )}

        {/* Tab 4: All-Time Rankings */}
        {activeTab === 'all-time' && (
          <HallOfFameAllTimeTab onSelectCampus={handleSelectCampus} />
        )}

        {/* Tab 5: Campus Profiles */}
        {activeTab === 'profiles' && (
          <CampusProfileView
            campusSlug={selectedCampusSlug}
            onSelectCampus={handleSelectCampus}
            onNavigateToStandings={() => handleTabChange('standings')}
            onNavigateToAllTime={() => handleTabChange('all-time')}
          />
        )}
      </div>
    </div>
  )
}
