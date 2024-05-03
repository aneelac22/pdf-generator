export const rosExecutiveData = {
  systems_per_state: {
    optimized: { count: 3, percentage: 9.68 },
    under_pressure: { count: 4, percentage: 12.9 },
    undersized: { count: 6, percentage: 19.35 },
    oversized: { count: 0, percentage: 0.0 },
    idling: { count: 20, percentage: 64.52 },
    waiting_for_data: { count: 0, percentage: 0.0 },
  },
  conditions: {
    io: {
      count: 4,
      percentage: 12.5,
      undersized: -1,
      oversized: -1,
      under_pressure: 4,
    },
    memory: {
      count: 14,
      percentage: 43.75,
      undersized: 6,
      oversized: 4,
      under_pressure: 4,
    },
    cpu: {
      count: 14,
      percentage: 43.75,
      undersized: 6,
      oversized: 4,
      under_pressure: 4,
    },
  },
  instance_types_highlights: {
    current: [
      {
        type: 't2.micro',
        count: 13,
        desc: 'Intel Xeon Family instance with 1 vCPUs and 1 GiB of RAM, running on AWS eu-west-2 regions',
      },
      {
        type: 't2.medium',
        count: 1,
        desc: 'Intel Xeon Family instance with 2 vCPUs and 4 GiB of RAM, running on AWS us-west-1 regions',
      },
      {
        type: 't2.micro',
        count: 13,
        desc: 'Intel Xeon Family instance with 1 vCPUs and 1 GiB of RAM, running on AWS eu-west-2 regions',
      },
      {
        type: 't2.medium',
        count: 1,
        desc: 'Intel Xeon Family instance with 2 vCPUs and 4 GiB of RAM, running on AWS us-west-1 regions',
      },
      {
        type: 't2.medium',
        count: 1,
        desc: 'Intel Xeon Family instance with 2 vCPUs and 4 GiB of RAM, running on AWS us-west-1 regions',
      },
    ],
    suggested: [],
    historical: [
      {
        type: 't2.nano',
        count: 89,
        desc: 'Intel Xeon Family instance with 1 vCPUs and 0.5 GiB of RAM, running on AWS sa-east-1 regions',
      },
      {
        type: 't2.medium',
        count: 1,
        desc: 'Intel Xeon Family instance with 2 vCPUs and 4 GiB of RAM, running on AWS us-west-1 regions',
      },
      {
        type: 't2.nano',
        count: 89,
        desc: 'Intel Xeon Family instance with 1 vCPUs and 0.5 GiB of RAM, running on AWS sa-east-1 regions',
      },
      {
        type: 't2.medium',
        count: 1,
        desc: 'Intel Xeon Family instance with 2 vCPUs and 4 GiB of RAM, running on AWS us-west-1 regions',
      },
      {
        type: 't2.medium',
        count: 1,
        desc: 'Intel Xeon Family instance with 2 vCPUs and 4 GiB of RAM, running on AWS us-west-1 regions',
      },
    ],
  },
  meta: {
    total_count: 31,
    non_optimized_count: 30,
    conditions_count: 32,
    non_psi_count: 1,
    psi_enabled_count: 7,
    stale_count: 10,
  },
};

export const rosSystemsData = {
  meta: {
    count: 11,
    limit: 6,
    offset: 0,
  },
  data: [
    {
      fqdn: 'iqe-ros-19ef96c7-9128-4cae-972c-6f525138314e',
      display_name: 'iqe-ros-19ef96c7-9128-4cae-972c-6f525138314e',
      inventory_id: '52534517-45a6-484e-9567-229ddc297ec7',
      org_id: '11789772',
      number_of_suggestions: 1,
      state: 'Idling',
      performance_utilization: {
        cpu: 0,
        memory: 0,
        max_io: 0.314,
        io_all: {
          xvda: 0.314,
        },
      },
      cloud_provider: 'aws',
      instance_type: 't2.micro',
      idling_time: '199.70',
      os: 'RHEL 8.4',
      report_date: '2023-04-05T00:11:23.197370+00:00',
    },
    {
      fqdn: 'iqe-ros-19ef96c7-9128-4cae-972c-6f525138314e',
      display_name: 'iqe-ros-19ef96c7-9128-4cae-972c-6f525138314e',
      inventory_id: '52534517-45a6-484e-9567-229ddc297ec7',
      org_id: '11789772',
      number_of_suggestions: 1,
      state: 'Waiting for Data',
      performance_utilization: {
        cpu: 0,
        memory: 0,
        max_io: 0.314,
        io_all: {
          xvda: 0.314,
        },
      },
      cloud_provider: 'aws',
      instance_type: 't2.micro',
      idling_time: '199.70',
      os: null,
      report_date: '2023-04-05T00:11:23.197370+00:00',
    },
    {
      fqdn: 'iqe-ros-19ef96c7-9128-4cae-972c-6f525138314e',
      display_name: 'iqe-ros-19ef96c7-9128-4cae-972c-6f525138314e',
      inventory_id: '52534517-45a6-484e-9567-229ddc297ec7',
      org_id: '11789772',
      number_of_suggestions: 1,
      state: 'Under Pressure',
      performance_utilization: {
        cpu: 0,
        memory: null,
        max_io: 0.314,
        io_all: {
          xvda: 0.314,
        },
      },
      cloud_provider: 'aws',
      instance_type: 't2.micro',
      idling_time: '199.70',
      os: 'RHEL 8.4',
      report_date: '2023-04-05T00:11:23.197370+00:00',
    },
    {
      fqdn: 'iqe-ros-19ef96c7-9128-4cae-972c-6f525138314e',
      display_name: 'iqe-ros-19ef96c7-9128-4cae-972c-6f525138314e',
      inventory_id: '52534517-45a6-484e-9567-229ddc297ec7',
      org_id: '11789772',
      number_of_suggestions: -1,
      state: 'Waiting for data',
      performance_utilization: {
        cpu: -1,
        memory: -1,
        max_io: -1,
        io_all: {
          xvda: 0.314,
        },
      },
      cloud_provider: 'aws',
      instance_type: 't2.micro',
      idling_time: '199.70',
      os: 'RHEL 8.4',
      report_date: '2023-04-05T00:11:23.197370+00:00',
    },
    {
      fqdn: 'iqe-ros-19ef96c7-9128-4cae-972c-6f525138314e',
      display_name: 'iqe-ros-19ef96c7-9128-4cae-972c-6f525138314e',
      inventory_id: '52534517-45a6-484e-9567-229ddc297ec7',
      org_id: '11789772',
      number_of_suggestions: 1,
      state: 'Idling',
      performance_utilization: {
        cpu: 0,
        memory: 0,
        max_io: 0.314,
        io_all: {
          xvda: 0.314,
        },
      },
      cloud_provider: 'aws',
      instance_type: 't2.micro',
      idling_time: '199.70',
      os: 'RHEL 8.4',
      report_date: '2023-04-05T00:11:23.197370+00:00',
    },
    {
      fqdn: 'iqe-ros-19ef96c7-9128-4cae-972c-6f525138314e',
      display_name: 'iqe-ros-19ef96c7-9128-4cae-972c-6f525138314e',
      inventory_id: '52534517-45a6-484e-9567-229ddc297ec7',
      org_id: '11789772',
      number_of_suggestions: 1,
      state: 'Idling',
      performance_utilization: {
        cpu: 0,
        memory: 0,
        max_io: 0.314,
        io_all: {
          xvda: 0.314,
        },
      },
      cloud_provider: 'aws',
      instance_type: 't2.micro',
      idling_time: '199.70',
      os: 'RHEL 8.4',
      report_date: '2023-04-05T00:11:23.197370+00:00',
    },
    {
      fqdn: 'iqe-ros-19ef96c7-9128-4cae-972c-6f525138314e',
      display_name: 'iqe-ros-19ef96c7-9128-4cae-972c-6f525138314e',
      inventory_id: '52534517-45a6-484e-9567-229ddc297ec7',
      org_id: '11789772',
      number_of_suggestions: 1,
      state: 'Idling',
      performance_utilization: {
        cpu: 0,
        memory: 0,
        max_io: 0.314,
        io_all: {
          xvda: 0.314,
        },
      },
      cloud_provider: 'aws',
      instance_type: 't2.micro',
      idling_time: '199.70',
      os: 'RHEL 8.4',
      report_date: '2023-04-05T00:11:23.197370+00:00',
    },
    {
      fqdn: 'iqe-ros-19ef96c7-9128-4cae-972c-6f525138314e',
      display_name: 'iqe-ros-19ef96c7-9128-4cae-972c-6f525138314e',
      inventory_id: '52534517-45a6-484e-9567-229ddc297ec7',
      org_id: '11789772',
      number_of_suggestions: 1,
      state: 'Idling',
      performance_utilization: {
        cpu: 0,
        memory: 0,
        max_io: 0.314,
        io_all: {
          xvda: 0.314,
        },
      },
      cloud_provider: 'aws',
      instance_type: 't2.micro',
      idling_time: '199.70',
      os: 'RHEL 8.4',
      report_date: '2023-04-05T00:11:23.197370+00:00',
    },
    {
      fqdn: 'iqe-ros-19ef96c7-9128-4cae-972c-6f525138314e',
      display_name: 'iqe-ros-19ef96c7-9128-4cae-972c-6f525138314e',
      inventory_id: '52534517-45a6-484e-9567-229ddc297ec7',
      org_id: '11789772',
      number_of_suggestions: 1,
      state: 'Idling',
      performance_utilization: {
        cpu: 0,
        memory: 0,
        max_io: 0.314,
        io_all: {
          xvda: 0.314,
        },
      },
      cloud_provider: 'aws',
      instance_type: 't2.micro',
      idling_time: '199.70',
      os: 'RHEL 8.4',
      report_date: '2023-04-05T00:11:23.197370+00:00',
    },
    {
      fqdn: 'iqe-ros-19ef96c7-9128-4cae-972c-6f525138314e',
      display_name: 'iqe-ros-19ef96c7-9128-4cae-972c-6f525138314e',
      inventory_id: '52534517-45a6-484e-9567-229ddc297ec7',
      org_id: '11789772',
      number_of_suggestions: 1,
      state: 'Idling',
      performance_utilization: {
        cpu: 0,
        memory: 0,
        max_io: 0.314,
        io_all: {
          xvda: 0.314,
        },
      },
      cloud_provider: 'aws',
      instance_type: 't2.micro',
      idling_time: '199.70',
      os: 'RHEL 8.4',
      report_date: '2023-04-05T00:11:23.197370+00:00',
    },
    {
      fqdn: 'iqe-ros-19ef96c7-9128-4cae-972c-6f525138314e',
      display_name: 'iqe-ros-19ef96c7-9128-4cae-972c-6f525138314e',
      inventory_id: '52534517-45a6-484e-9567-229ddc297ec7',
      org_id: '11789772',
      number_of_suggestions: 1,
      state: 'Idling',
      performance_utilization: {
        cpu: 0,
        memory: 0,
        max_io: 0.314,
        io_all: {
          xvda: 0.314,
        },
      },
      cloud_provider: 'aws',
      instance_type: 't2.micro',
      idling_time: '199.70',
      os: 'RHEL 8.4',
      report_date: '2023-04-05T00:11:23.197370+00:00',
    },
  ],
};

export const rosSystemFilters = {
  display_name: 'iqe',
  state: ['Waiting for data', 'Optimized'],
  os: ['9.0', '7.7'],
  group_name: ['team-ros', 'team-ocp'],
};

export const isRosSystemsData = (obj: any) => {
  if (
    typeof obj === 'object' &&
    obj !== null &&
    'meta' in obj &&
    'data' in obj &&
    typeof obj.meta === 'object' &&
    typeof obj.data === 'object' &&
    Array.isArray(obj.data)
  ) {
    return true;
  } else {
    return false;
  }
};
