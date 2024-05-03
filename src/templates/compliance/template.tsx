import React from 'react';
import { Text, TextContent, Title } from '@patternfly/react-core';
import Page from '../common/page';
import PolicyDetailsTable from './components/PolicyDetailsTable';
import SupportedSystemsTable from './components/SupportedSystemsTable';
import UnsupportedSystemsTable from './components/UnsupportedSystemsTable';
import UnreportedSystemsTable from './components/UnreportedSystemsTable';
import SystemsTableHeader from './components/SystemsTableHeader';
import RulesTable from './components/RulesTable';
import getHeaderDate from '../common/get-header-date';
import {
  ComplianceSystemsInterface,
  PolicyInterface,
  RulesCollection,
} from './utils/interfaces';

const ComplianceTemplate = ({
  compliantSystemCount,
  nonCompliantSystemCount,
  unsupportedSystemCount,
  compliantSystems,
  nonCompliantSystems,
  unsupportedSystems,
  nonReportingSystems,
  totalHostCount,
  topTenFailedRules,
  userNotes,
  policy,
  expectedSSGVersion,
}: {
  compliantSystemCount: number;
  nonCompliantSystemCount: number;
  nonReportingSystemsCount: number;
  unsupportedSystemCount: number;
  compliantSystems: ComplianceSystemsInterface[];
  nonCompliantSystems: ComplianceSystemsInterface[];
  unsupportedSystems: ComplianceSystemsInterface[];
  nonReportingSystems: ComplianceSystemsInterface[];
  totalHostCount: number;
  topTenFailedRules: RulesCollection[];
  userNotes: string;
  policy: PolicyInterface;
  expectedSSGVersion: string;
}) => {
  return (
    <React.Fragment>
      <Page>
        <Title
          headingLevel="h2"
          className="pf-u-danger-color-200 pf-u-font-size-2xl"
        >
          Red Hat Insights
        </Title>
        <Title
          headingLevel="h1"
          className="pf-u-danger-color-200 pf-u-font-size-4xl pf-u-mt-xs"
        >
          Compliance: C2S for Red Hat Enterprise Linux 7
        </Title>
        <TextContent>
          <Text className="pf-u-mt-2xl pf-u-mb-lg pf-u-danger-color-100">
            Report prepared&nbsp;{getHeaderDate()}
          </Text>
          {userNotes && <Text className="">{userNotes}</Text>}
        </TextContent>
        <PolicyDetailsTable
          policy={policy}
          nonCompliantSystemsCount={nonCompliantSystemCount}
          totalHostCount={totalHostCount}
          compliantSystemCount={compliantSystemCount}
          className="pf-u-mb-2xl"
        />
        <Title
          headingLevel="h2"
          className="pf-u-danger-color-100 pf-u-font-size-lg pf-u-mt-xl"
        >
          Systems:
        </Title>
        <SystemsTableHeader
          compliantSystemCount={compliantSystemCount}
          nonCompliantSystemCount={nonCompliantSystemCount}
          unsupportedSystemCount={unsupportedSystemCount}
        />
        <Title
          headingLevel="h2"
          className="pf-u-danger-color-100 pf-u-font-size-lg pf-u-mt-xl"
        >
          Non-compliant Systems:
        </Title>
        <SupportedSystemsTable
          systems={nonCompliantSystems}
          className="pf-u-mb-2xl"
        />
        <Title
          headingLevel="h2"
          className="pf-u-danger-color-100 pf-u-font-size-lg pf-u-mt-xl"
        >
          Compliant Systems:
        </Title>
        <SupportedSystemsTable
          systems={compliantSystems}
          className="pf-u-mb-2xl"
        />
        <Title
          headingLevel="h2"
          className="pf-u-danger-color-100 pf-u-font-size-lg pf-u-mb-xs pf-u-mt-xl"
        >
          Unsupported Systems:
        </Title>
        <UnsupportedSystemsTable
          systems={unsupportedSystems}
          expectedSSGVersion={expectedSSGVersion}
          className="pf-u-mb-2xl"
        />
        <Title
          headingLevel="h1"
          className="pf-u-danger-color-100 pf-u-font-size-lg pf-u-mb-xs pf-u-mt-xl"
        >
          Non-Reporting Systems:
        </Title>
        <UnreportedSystemsTable
          systems={nonReportingSystems}
          className="pf-u-mb-2xl"
        />
        <Title
          headingLevel="h1"
          className="pf-u-danger-color-100 pf-u-font-size-2xl pf-u-mb-xs pf-u-mt-2xl"
        >
          Rules
        </Title>
        <Title
          headingLevel="h2"
          className="pf-u-danger-color-100 pf-u-font-size-lg pf-u-mb-xs"
        >
          Top failed rules
        </Title>
        <RulesTable topRules={topTenFailedRules} className="pf-u-mb-2xl" />
      </Page>
    </React.Fragment>
  );
};

export default ComplianceTemplate;
