Feature: Kafka =>

  @TMU-32519
  @kafka
  Scenario:mute unmute kafka TRLs
    Given System is running on MCU_HOME
    Given create conference 890001
    When create audio room for host chandler
    Then CREATE_CONF message for audio room is in kafka under context topic offset 0
    And add participant:
      | Participant | meetingID | roomType |
      | chandler    | context   | audio    |
      | ross        | context   | audio    |
    Then PARTICIPATE_REQUEST and JOIN_PARTICIPANT messages is in kafka under context topic:
      | Participant |roomType     | offset |
      | chandler    |audio-video  |  1     |
      | ross        |audio-video  |  3     |
    And mute ross
    Then MUTE_PARTICIPANT message for ross participant in audio-video room is in kafka under context topic offset 5
    And unmute ross
    Then UNMUTE_PARTICIPANT message for ross participant in audio-video room is in kafka under context topic offset 6
    And leave participant:
      | Participant | meetingID | roomType     |
      | ross        | context   | audio        |
      | chandler    | context   | audio        |
    Then UNJOIN_PARTICIPANT message is in kafka under context topic:
      | Participant |roomType     | offset |
      | ross        |audio-video  |  7     |
      | chandler    |audio-video  |  8     |
    Then destroy audio room
    Then DESTROY_CONF message for audio room is in kafka under context topic offset 9




  @TMU-32520
  @video
  @kafka
  Scenario: open and close camera kafka TRLs
    Given System is running on MCU_HOME
    Given create conference 890002
    When create audio room for host chandler
    Then CREATE_CONF message for audio room is in kafka under context topic offset 0
    And add participant:
      | Participant | meetingID | roomType      |userType |
      | chandler    | context   | audio-video   |receiver |
    Then PARTICIPATE_REQUEST and JOIN_PARTICIPANT messages is in kafka under context topic:
      | Participant |roomType     | offset |
      | chandler    |audio-video  |  1     |
 #   When create data-channel room for host chandler
  #  Then CREATE_CONF message for data-channel room is in kafka under context topic offset 3
    And add participant:
      | Participant | meetingID | roomType    | userType |
    #  | chandler    | context   | data-channel | receiver |
      | ross        | context   | audio-video | sender   |
   #   | ross        | context   | data-channel  | receiver  |
    Then PARTICIPATE_REQUEST and JOIN_PARTICIPANT messages is in kafka under context topic:
      | Participant | roomType    | offset |
    #  | chandler    | data-channel | 4      |
      | ross        | audio-video | 6      |
     # | ross        |data-channel |  8     |
    And chandler reInvite in audio-video roomType as sender
    Then CAMERA_ON message for chandler participant in audio-video room is in kafka under context topic offset 10
    And chandler reInvite in audio-video roomType as receiver
    Then CAMERA_OFF message for chandler participant in audio-video room is in kafka under context topic offset 11
    And leave participant:
      | Participant | meetingID | roomType    |
     # | ross        | context   | data-channel |
     # | chandler    | context   | data-channel  |
      | ross        | context   | audio-video |
      | chandler    | context   | audio-video |
    Then UNJOIN_PARTICIPANT message is in kafka under context topic:
      | Participant | roomType    | offset |
   #   | ross        | data-channel | 12     |
  #    | chandler    |data-channel |  13    |
      | ross        | audio-video | 14     |
      | chandler    | audio-video | 15     |
  #  Then destroy data-channel room
  #  Then DESTROY_CONF message for data-channel room is in kafka under context topic offset 16
    Then destroy audio room
    Then DESTROY_CONF message for audio room is in kafka under context topic offset 17



  @TMU-32521
  @kafka
  @screen-share
  Scenario: open and close SS kafka TRLs
    Given System is running on MCU_HOME
    Given create conference 890003
    When create audio room for host chandler
    Then CREATE_CONF message for audio room is in kafka under context topic offset 0
    And add participant:
      | Participant |roomType | meetingID |
      | chandler    |audio    | context   |
      | ross        |audio    | context   |
    Then PARTICIPATE_REQUEST and JOIN_PARTICIPANT messages is in kafka under context topic:
      | Participant |roomType   | offset |
      | chandler    |audio      |  1     |
      | ross        |audio      |  3     |
    When create screen-share room for host chandler
    Then CREATE_CONF message for screen-share room is in kafka under context topic offset 5
    Then ross is publisher
    Then SS_STARTS message for ross participant in screen-share room is in kafka under context topic offset 6
    And leave participant:
      | Participant |roomType     | meetingID |
      | ross        |screen-share | context   |
    Then SS_ENDS message for ross participant in screen-share room is in kafka under context topic offset 7
    And leave participant:
      | Participant |roomType     | meetingID |
      | chandler    |audio        | context   |
      | ross        |audio        | context   |
    Then UNJOIN_PARTICIPANT message is in kafka under context topic:
      | Participant |roomType     | offset |
      | chandler    |audio        |  8    |
      | ross        |audio        |  9    |
    Then destroy screen-share room
    Then DESTROY_CONF message for screen-share room is in kafka under context topic offset 10
    Then destroy audio room
    Then DESTROY_CONF message for audio room is in kafka under context topic offset 11