Feature: mMCU - TLS =>

#  Background: MCU is using TLS
#    Given System is running on MCU_HOME
#    Given MCU TLS port 5061

  @sanity
  @tls
  @TMU-24522
  Scenario: Sanity audio conference with tls
    Given System is running on MCU_HOME
    #This tet should not be allowed to run on certain environments
    Then enable skip by environment
    Given MCU TLS port 5061
    Given create conference 100101
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
 #   When create data-channel room for host chandler
    And add participant:
      | Participant | meetingID | roomType | userType |
    #  | chandler    | context   | data-channel | sender   |
      | ross        | context   | audio    | sender   |
     # | ross        | context   | data-channel | sender   |
    And leave participant:
      | Participant | meetingID | roomType |
     # | ross        | context   | data-channel |
     # | chandler    | context   | data-channel |
      | ross        | context   | audio    |
      | chandler    | context   | audio    |
   # Then destroy data-channel room
    Then destroy audio room

  @tls
  @nightly
  @tls-notify
  @TMU-24832
  Scenario: Notify TLS
  """
  sip notify send BYE for close connection after 60 seconds without RTP
  """
    Given System is running on MCU_HOME
    #This tet should not be allowed to run on certain environments
    Then enable skip by environment
    Given MCU TLS port 5061
    Given create conference 100091
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType      |
      | chandler    | context   | audio         |
    #starts internal timer for validation and continues to nest step
    Then validate participant chandler BYE in audio room
    #wait for user inactivity timer (mMCU)
    Then Sleep 60 sec
    #starts internal timer for validation and continues to nest step
    Then validate audio room BYE
    #wait for room to be finally closed by server (mMCU)
    Then Sleep 240 sec
    Then Failed destroy audio room
