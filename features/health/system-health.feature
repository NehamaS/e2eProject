Feature: mMCU Cluster Health =>
  Cluster "health type" apis verifications

  @rest
  @health
  @TMU-24047
  Scenario: Checking cluster health
    Given System is platform PLATFORM_TYPE running on MCU_HOME
    When invoking healthcheck api
    Then i should get 200 response
    And status is INS

  @rest
  @health
  @TMU-24048
  Scenario: Checking cluster load level
    Given System is platform PLATFORM_TYPE running on MCU_HOME
    When invoking cluster-load api
    Then i should get 200 response
    And status is INS

  @sanity
  @rest
  @consul
  @discovery
  Scenario Outline: Checking discovery system
  """
  Execute a set of discovery queries supported in consul only
  """
    Given System is platform SWARM running on MCU_HOME
    When invoking <service-discovery> api
    Then i should get 200 response

    Examples:
      | service-discovery   |
      | sip                 |
      | mcu                 |
      | etcd                |
      | sip-gateway         |
      | sip-gateway-notify  |
      | mcu-monitor-service |
      | mcu-stats-service   |
      | media-gateway       |

  @sip
  Scenario: Sip options support
    Given System is platform PLATFORM_TYPE running on MCU_HOME
    When sip options api is invoked
    Then i should get 200 response
    And these options should be supported
      | option  |
      | INVITE  |
      | ACK     |
      | CANCEL  |
      | INFO    |
      | BYE     |
      | NOTIFY  |
      | OPTIONS |

#  Scenario Outline: Checking cluster load level
#    Given System is platform <type> running on <address>
#    When invoking cluster-load api on <port>
#    Then i should get 200 response
#    And status is INS
#
#    Examples:
#      | type    | address                             | port |
#      | SWARM   | 10.45.35.61                         | 3443 |
#      | K8S     | monitor-dev.il-labs.mavenir.com     | 443  |
