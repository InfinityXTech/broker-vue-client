<script setup lang="ts">
import { ref } from 'vue'
import { isMobileScreen } from '/@src/utils/responsive'
import { useUserSession } from '/@src/stores/userSession'
import { useRouter } from 'vue-router'
import { useApi } from '/@src/composable/useApi'
import { useNotyf } from '/@src/composable/useNotyf'
import { useSystem } from '/@src/stores/system'

export type SidebarLayoutLinksType = 'top' | 'bottom'
const props = withDefaults(
    defineProps<{
        position?: SidebarLayoutLinksType
    }>(),
    {
        position: 'top',
    }
)

const userSession = useUserSession()
const notif = useNotyf()
const api = useApi()
const system = useSystem()
const router = useRouter()
const isLogoutLoading = ref(false)

const is_admin = userSession.roles().is('admin')
const broker_permissions = userSession.permissions('brokers')
const traffic_endpoint_permissions = userSession.permissions('traffic_endpoint')
const advertiser_permissions = userSession.permissions('marketing_advertisers')
const affiliate_permissions = userSession.permissions('marketing_affiliates')

const onLogout = async () => {
    try {
        isLogoutLoading.value = true
        await api.post('/auth/logout')
        userSession.logoutUser()
        router.push({ name: 'auth-login' })
    } catch (err) {
        notif.dismissAll()
        notif.error((err as Error).message)
    } finally {
        isLogoutLoading.value = false
    }
}
</script>
<template>
    <!-- Data -->
    <li v-if="system.active == 'data' && props.position == 'top' && userSession.permissions('brokers').is_active()">
        <SidebarLink :to="{ name: 'data-brokers' }" tooltip="Brokers">
            <BrokersIcon class="sidebar-svg" />
        </SidebarLink>
    </li>
    <li v-if="system.active == 'data' && props.position == 'top' && userSession.permissions('traffic_endpoint').is_active()">
        <SidebarLink :to="{ name: 'data-providers' }" tooltip="Data Providers">
            <TrafficEndpointsIcon class="sidebar-svg" />
        </SidebarLink>
    </li>
    <li v-if="system.active == 'data' && props.position == 'top' && userSession.permissions('planning').is_active()">
        <SidebarLink :to="{ name: 'data-deals' }" tooltip="Data Deals">
            <PlanningSimulationIcon class="sidebar-svg" />
        </SidebarLink>
    </li>
    <li v-if="system.active == 'data' && props.position == 'top' && userSession.permissions('billings').is_active()">
        <SidebarLink :to="{ name: 'data-billings-overall' }" tooltip="Billings Dashboard">
            <BillingsIcon class="sidebar-svg" />
        </SidebarLink>
    </li>

    <!-- CRM -->
    <li v-if="system.active == 'crm' && props.position == 'top' && userSession.permissions('brokers').is_active()">
        <SidebarLink :to="{ name: 'brokers' }" tooltip="Brokers">
            <BrokersIcon class="sidebar-svg" />
        </SidebarLink>
    </li>
    <!-- <li>
        <SidebarLink :to="{ name: 'traffic_endpoints' }">
            <BrokerToolsIcon class="sidebar-svg" />
        </SidebarLink>
    </li> -->
    <li v-if="system.active == 'crm' && props.position == 'top' && userSession.permissions('traffic_endpoint').is_active()">
        <SidebarLink :to="{ name: 'traffic_endpoints' }" tooltip="Traffic Endpoints">
            <TrafficEndpointsIcon class="sidebar-svg" />
        </SidebarLink>
    </li>

    <li v-if="system.active == 'crm' && props.position == 'top' && userSession.permissions('planning').is_active()">
        <SidebarLink :to="{ name: 'planning' }" tooltip="Planning Simulation">
            <PlanningSimulationIcon class="sidebar-svg" />
        </SidebarLink>
    </li>

    <li v-if="system.active == 'crm' && props.position == 'top' && userSession.permissions('crm').is_active()">
        <SidebarLink :to="{ name: 'crm-type', params: { type: 'leads' } }" tooltip="CRM">
            <CrmIcon class="sidebar-svg" />
        </SidebarLink>
    </li>

    <li
        v-if="
            system.active == 'crm' &&
            props.position == 'top' &&
            (userSession.permissions('quality_reports').is_active() ||
                userSession.permissions('reports').is_active() ||
                userSession.permissions('click_reports').is_active())
        "
    >
        <SidebarLink :to="{ name: 'report' }" tooltip="Reports">
            <BiReportIcon class="sidebar-svg" />
        </SidebarLink>
    </li>

    <li v-if="system.active == 'crm' && props.position == 'top' && userSession.permissions('billings').is_active()">
        <SidebarLink :to="{ name: 'billings-overall' }" tooltip="Billings Dashboard">
            <BillingsIcon class="sidebar-svg" />
        </SidebarLink>
    </li>

    <li v-if="system.active == 'crm' && props.position == 'top' && userSession.permissions('leads_review').is_active()">
        <SidebarLink :to="{ name: 'leads_review' }" tooltip="Leads Review">
            <LeadsReviewIcon class="sidebar-svg" />
        </SidebarLink>
    </li>

    <!-- Marketing Menu -->
    <li v-if="system.active == 'marketing' && props.position == 'top' && userSession.permissions('marketing_advertisers').is_active()">
        <SidebarLink :to="{ name: 'advertisers' }" tooltip="Advertisers">
            <CampaignsIcon class="sidebar-svg" />
        </SidebarLink>
    </li>
    <li v-if="system.active == 'marketing' && props.position == 'top' && userSession.permissions('marketing_affiliates').is_active()">
        <SidebarLink :to="{ name: 'affiliates' }" tooltip="Affiliates">
            <AffiliateIcon class="sidebar-svg" />
        </SidebarLink>
    </li>
    <li v-if="system.active == 'marketing' && props.position == 'top' && userSession.permissions('marketing_gravity').is_active()">
        <SidebarLink :to="{ name: 'marketing_gravity-type', params: { type: 'auto' } }" tooltip="Gravity Dashboard">
            <GravityIcon2 class="sidebar-svg" />
        </SidebarLink>
    </li>
    <li v-if="system.active == 'marketing' && props.position == 'top' && userSession.permissions('marketing_applications').is_active()">
        <SidebarLink :to="{ name: 'affiliates-application' }" tooltip="Longtail Applications">
            <LongtailAppIcon class="sidebar-svg" />
        </SidebarLink>
    </li>
    <li v-if="system.active == 'marketing' && props.position == 'top' && userSession.permissions('marketing_billings').is_active()">
        <SidebarLink :to="{ name: 'marketing_billings-overall' }" tooltip="Billings Dashboard">
            <BillingsIcon class="sidebar-svg" />
        </SidebarLink>
    </li>
    <li v-if="system.active == 'marketing' && props.position == 'top' && userSession.permissions('marketing_reports').is_active()">
        <SidebarLink :to="{ name: 'marketing_report' }" tooltip="Reports">
            <BiReportIcon class="sidebar-svg" />
        </SidebarLink>
    </li>
    <!-- /Marketing Menu -->

    <li v-if="system.active == 'crm' && props.position == 'bottom' && userSession.permissions('leads_review_support').is_active()">
        <SidebarLink :to="{ name: 'leads_review_support' }" tooltip="Leads Review Support">
            <LeadsReviewSupportIcon class="sidebar-svg" />
        </SidebarLink>
    </li>

    <li v-if="props.position == 'bottom'">
        <SidebarLink :to="{ name: 'support' }" tooltip="Support">
            <SupportIcon class="sidebar-svg" />
        </SidebarLink>
    </li>

    <li v-if="props.position == 'bottom'">
        <SidebarPanel :dropdown="false" :position="'popup'" event="hover">
            <!--tooltip="Tools" -->
            <template v-if="!isMobileScreen" #icon><VAvatar picture="/images/avatars/vuero-1.svg" /></template>
            <!--<ToolsIcon class="sidebar-svg" />-->
            <template #title>
                <span class="subpanel-header-title">Tools</span>
                <div class="logout-button">
                    <VButton
                        icon="feather:log-out"
                        :icon-props="{ width: 21, height: 21, color: 'white' }"
                        color="primary"
                        :loading="isLogoutLoading"
                        role="menuitem"
                        raised
                        fullwidth
                        @click="onLogout"
                    >
                        Logout
                    </VButton>
                </div>
            </template>
            <template #items>
                <div v-if="system.active == 'crm'">
                    <div class="columns is-multiline">
                        <div class="column inv-column is-5">
                            <li v-if="userSession.permissions('masters').is_active()">
                                <RouterLink :to="{ name: 'masters' }" tooltip="Masters">Masters </RouterLink>
                            </li>

                            <li v-if="userSession.permissions('gravity').is_active()">
                                <RouterLink :to="{ name: 'gravity-type', params: { type: 'auto' } }" tooltip="Gravity Dashboard" style="font-size: 12px">
                                    Gravity Dashboard
                                </RouterLink>
                            </li>

                            <li>
                                <RouterLink :to="{ name: 'scheduled_alerts' }" tooltip="Scheduled Alerts"> Scheduled Alerts </RouterLink>
                            </li>
                        </div>

                        <div class="column inv-column is-7">
                            <li v-if="userSession.permissions('performance').is_active()">
                                <RouterLink :to="{ name: 'performance-general' }" tooltip="Performance Dashboard"> Performance Dashboard </RouterLink>
                            </li>
                            <li v-if="userSession.features().is_public('PT100')">
                                <RouterLink :to="{ name: 'tags_management' }" tooltip="Tags Management"> Tags Management </RouterLink>
                            </li>
                            <!--li v-if="false && is_admin">
                                <RouterLink :to="{ name: 'traffic_endpoints-application' }" tooltip="Longtail Applications">
                                    Longtail Applications
                                </RouterLink>
                            </li-->
                            <!--li v-if="is_admin">
                            <SidebarLink :to="{ name: 'traffic_endpoints-application' }"> Show Full Application </SidebarLink>
                        </li-->
                        </div>
                    </div>
                    <div class="columns is-multiline">
                        <div
                            v-if="
                                broker_permissions.is_active() &&
                                (broker_permissions.is_allow('daily_cap') ||
                                    (broker_permissions.is_allow('unpayable_leads') &&
                                        userSession.features().is_public('PV38') &&
                                        userSession.roles().is('financial')) ||
                                    broker_permissions.is_allow('tools') ||
                                    broker_permissions.is_allow('spy_tool'))
                            "
                            class="column inv-column is-5"
                        >
                            <div class="subpanel-header">
                                <h3>Brokers</h3>
                            </div>
                            <li v-if="broker_permissions.is_allow('daily_cap')">
                                <RouterLink :to="{ name: 'brokers-caps', params: { type: 'auto' } }" tooltip="Caps Dashboard"> Caps Dashboard </RouterLink>
                            </li>
                            <li
                                v-if="
                                    broker_permissions.is_allow('unpayable_leads') &&
                                    userSession.features().is_public('PV38') &&
                                    userSession.roles().is('financial')
                                "
                            >
                                <RouterLink :to="{ name: 'brokers-un_payable_leads', params: { type: 'auto' } }" tooltip="UnPayable Leads">
                                    UnPayable Leads
                                </RouterLink>
                            </li>
                            <li v-if="broker_permissions.is_allow('tools')">
                                <RouterLink :to="{ name: 'brokers-emailschecker', params: { type: 'auto' } }" tooltip="Broker Tools"> Broker Tools </RouterLink>
                            </li>
                            <li v-if="broker_permissions.is_allow('spy_tool') && false">
                                <RouterLink :to="{ name: 'brokers-spy_tool', params: { type: 'auto' } }" tooltip="Spy Tool"> Spy Tool </RouterLink>
                            </li>
                        </div>
                        <div class="column inv-column is-7">
                            <div
                                v-if="
                                    traffic_endpoint_permissions.is_active() &&
                                    (traffic_endpoint_permissions.is_allow('marketing_suite') ||
                                        traffic_endpoint_permissions.is_allow('unpayable_leads') ||
                                        traffic_endpoint_permissions.is_allow('broker_simulator'))
                                "
                                class="subpanel-header"
                            >
                                <h3>Traffic Endpoints</h3>
                            </div>
                            <li v-if="traffic_endpoint_permissions.is_allow('marketing_suite')">
                                <RouterLink :to="{ name: 'traffic_endpoints-marketing_suite', params: { type: 'auto' } }" tooltip="Marketing Suite">
                                    Marketing Suite
                                </RouterLink>
                            </li>
                            <li
                                v-if="
                                    traffic_endpoint_permissions.is_allow('unpayable_leads') &&
                                    userSession.features().is_public('PV38') &&
                                    userSession.roles().is('financial')
                                "
                            >
                                <RouterLink :to="{ name: 'traffic_endpoints-un_payable_leads', params: { type: 'auto' } }" tooltip="UnPayable Leads">
                                    UnPayable Leads
                                </RouterLink>
                            </li>
                            <li v-if="userSession.roles().is('tech_support', 'integration_manager')">
                                <RouterLink :to="{ name: 'traffic_endpoints-lead_analysis', params: { type: 'auto' } }" tooltip="Lead Analysis">
                                    Lead Analysis
                                </RouterLink>
                            </li>
                            <li v-if="userSession.roles().is('tech_support', 'integration_manager')">
                                <RouterLink :to="{ name: 'traffic_endpoints-response_tools', params: { type: 'auto' } }" tooltip="Response Tools">
                                    Response Tools
                                </RouterLink>
                            </li>
                        </div>
                    </div>
                </div>
                <div v-else-if="system.active == 'marketing'">
                    <div class="columns is-multiline">
                        <div class="column inv-column is-5">
                            <li v-if="userSession.permissions('marketing_gravity').is_active()">
                                <RouterLink
                                    :to="{ name: 'marketing_gravity-type', params: { type: 'auto' } }"
                                    tooltip="Gravity Dashboard"
                                    style="font-size: 12px"
                                >
                                    Gravity Dashboard
                                </RouterLink>
                            </li>
                        </div>
                        <div class="column inv-column is-7">
                            <li v-if="userSession.permissions('marketing_applications').is_active()">
                                <RouterLink :to="{ name: 'affiliates-application' }" tooltip="Longtail Applications"> Longtail Applications </RouterLink>
                            </li>
                        </div>
                    </div>
                    <div class="columns is-multiline">
                        <div v-if="true" class="column inv-column is-5">
                            <div class="subpanel-header">
                                <h3>Advertisers</h3>
                            </div>
                            <li v-if="advertiser_permissions.is_active() && advertiser_permissions.is_allow('unpayable_leads')">
                                <RouterLink :to="{ name: 'advertisers-un_payable', params: { type: 'auto' } }" tooltip="UnPayable">
                                    UnPayable Leads
                                </RouterLink>
                            </li>
                        </div>
                        <div class="column inv-column is-7">
                            <div v-if="true" class="subpanel-header">
                                <h3>Affiliate</h3>
                            </div>
                            <li v-if="affiliate_permissions.is_active() && affiliate_permissions.is_allow('unpayable_leads')">
                                <RouterLink :to="{ name: 'affiliates-un_payable', params: { type: 'auto' } }" tooltip="UnPayable"> UnPayable Leads </RouterLink>
                            </li>
                        </div>
                    </div>
                </div>
            </template>
        </SidebarPanel>
    </li>

    <!--li>
        <SidebarLink :to="{ name: 'traffic_endpoints' }">
            <GravityIcon class="sidebar-svg" />
        </SidebarLink>
    </!--li>
    <li>
        <SidebarLink :to="{ name: 'traffic_endpoints' }">
            <QualityReportIcon class="sidebar-svg" />
        </SidebarLink>
    </li>
    <li>
        <SidebarLink :to="{ name: 'traffic_endpoints' }">
            <BiReportIcon class="sidebar-svg" />
        </SidebarLink>
    </li>
    <li>
        <SidebarLink :to="{ name: 'traffic_endpoints' }">
            <ClickReportIcon class="sidebar-svg" />
        </SidebarLink>
    </li>
    <li>
        <SidebarLink :to="{ name: 'traffic_endpoints' }">
            <BillingsIcon class="sidebar-svg" />
        </SidebarLink>
    </li>
    <li>
        <SidebarLink :to="{ name: 'traffic_endpoints' }">
            <SupportIcon class="sidebar-svg" />
        </SidebarLink>
    </li> -->
</template>
<style lang="scss">
.sidebar-panel,
.mobile-subsidebar {
    &.mobile-position-popup {
        width: 300px;

        .logout-button {
            padding: 7px 7px 0 0;
            position: absolute;
            right: 42px;
            top: 8px;
        }
    }

    &.position-popup {
        > .subpanel-header {
            border-bottom: 1px solid silver;
        }

        .logout-button {
            padding: 7px 7px 0 0;
            position: absolute;
            right: 8px;
            top: 8px;

            button {
                width: 100px;
                height: 30px;
            }
        }

        .simplebar-content {
            li {
                a:hover,
                a.router-link-exact-active {
                    .sidebar-svg {
                        color: var(--dark-text) !important;
                    }
                }
            }
        }
    }
}
</style>
