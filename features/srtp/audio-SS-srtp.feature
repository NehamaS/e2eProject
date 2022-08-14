Feature: SRTP audio-SS =>

  @sanity
  @srtp
  @TMU-18094
  Scenario: audio-SS-srtp-rooms
    Given System is running on MCU_HOME
    Given create conference 110060
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType      | srtp  |
      | chandler    | context   | audio         | true  |
   # When create data-channel room for host chandler
    When create screen-share room for host chandler
    And add participant:
      | Participant | meetingID | roomType     | srtp |
   #   | chandler    | context   | data-channel  | true  |
      | ross        | context   | audio        | true |
    #  | ross        | context   | data-channel | true |
      | ross        | context   | screen-share | true |
    Then Sleep 10 sec in case STREAM set to TRUE
    And leave participant:
      | Participant | meetingID | roomType     |
     # | ross        | context      | data-channel  |
     # | chandler    | context   | data-channel |
      | ross        | context   | audio        |
      | chandler    | context   | audio        |
      | ross        | context   | screen-share |
    Then destroy screen-share room
   # Then destroy data-channel room
    Then destroy audio room

  @srtp
  @TMU-20534
  Scenario: RTP & SRTP in same room
    Given System is running on MCU_HOME
    Given create conference 110070
    When create audio room for host chandler
    And add participant:
      | Participant | meetingID | roomType      | srtp  |
      | chandler    | context   | audio         | true  |
  #  When create data-channel room for host chandler
    When create screen-share room for host chandler
    And add participant:
      | Participant | meetingID | roomType     | srtp  |
    #  | chandler    | context   | data-channel  | true  |
      | ross        | context   | audio        | false |
     # | ross        | context   | data-channel | false |
      | ross        | context   | screen-share | false |
    Then Sleep 10 sec in case STREAM set to TRUE
    And leave participant:
      | Participant | meetingID | roomType     |
     # | ross        | context      | data-channel  |
      #| chandler    | context   | data-channel |
      | ross        | context   | audio        |
      | chandler    | context   | audio        |
      | ross        | context   | screen-share |
    Then destroy screen-share room
   # Then destroy data-channel room
    Then destroy audio room
